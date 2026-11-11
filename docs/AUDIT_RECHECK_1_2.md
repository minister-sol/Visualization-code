# 任务 1.2：ROADMAP_AUDIT 阻断项独立复核

- 执行者：dsh
- 日期：2026-11-11
- 基线：`main` @ `2d990d6`，工作区含两个未跟踪文档（`AGENTS.md`、`docs/EXECUTION_PLAN.md`）
- 环境：Windows，Python 3.12.10，Node v24.20.0，GCC 16.2.0（MSYS2）
- 方法：静态读码定位 + 最小输入实跑对比 GCC 输出。凡标“已验证”的条目均有下列命令的实际输出；标“推断”的条目未实跑。
- 复现脚本：`probes/audit_1_2_probe.py`（只读调用 `backend.engine.trace`，输出 JSON 记录）

## 结论摘要

原审计的 6 类阻断项**方向均成立**，但其中 2 条的描述与实测不符，且复核发现 1 个更严重的崩溃缺陷：

| # | 审计条目 | 复核结论 | 判定 |
|---|---|---|---|
| 1 | 位域静默错误 | 成立，且新增：匿名/零宽位域触发未捕获 `TypeError` | **已验证**，最高优先级 |
| 2 | 规模上限 | 成立；但“n≥100 循环失败”不准确，实测 370 次迭代仍可跑 | **已验证**（含修正） |
| 3 | union / goto 未支持 | 两者均**显式拒绝**；审计称“无 goto 处理”不准确。缺行号的是 union | **已验证**（含修正） |
| 4 | 裸字节分配 | 成立，显式拒绝且带行号 | **已验证** |
| 5 | 库与格式窄 | 成立，均显式拒绝；但 `%*d` 实际已支持，与 COVERAGE:389 矛盾 | **已验证**（含修正） |
| 6 | 诊断与文档 | 解析错误确实无行号；COVERAGE 统计过期（370→535、85→103） | **已验证** |

## 基线与测试证据

```
python -m unittest discover -s tests
Ran 535 tests in 12.030s
OK

node tests/test_object_layout.cjs   # 2 段输出全部 passed
node tests/test_state_view.cjs      # 4 段输出全部 passed

python tests/compare_gcc.py         # exit 0，统计到 103 条 "GCC output/status matches"
```

即：`README.md:63` 的“535 项”和“103 段”**与实测一致**；`docs/COVERAGE.md:19` 的“370 项测试”“85 段源码”**已过期**。

## A. 位域（审计项 1）— 阻断，静默误算

静态证据：`backend/engine.py:806-817` 的 `make_struct` 逐字段写入 `obj[field.name]`，从不读取 `field.bitsize`；`backend/engine.py:273` 的结构体字节布局按完整成员类型对齐，无位宽打包。全仓库对 `bitsize` 零引用。

实测（`probes/audit_1_2_probe.py`，GCC 16.2.0 对照）：

| 最小输入 | GCC 实际 | 引擎实际 | 是否报错 |
|---|---|---|---|
| `struct S{int a:3;int b:5;};` → `printf("%d",sizeof(struct S))` | `4` | `8` | 否 |
| `s.a=7; printf("%d",s.a)`（`int a:3`） | `-1` | `7` | 否 |
| `s.b=31; printf("%d",s.b)`（`int b:5`） | `-1` | `31` | 否 |
| `s.a=9; printf("%d",s.a)`（`int a:3`） | `1` | `9` | 否 |
| `struct S{unsigned char c:1;}; s.c=2` | `0`，`sizeof`=1 | `2`，`sizeof`=1 | 否 |
| `struct S{char a:1;char b:1;}` → `sizeof` | `1` | `2` | 否 |
| `struct S{int a:3;int :0;int b:3;}` → 声明并使用 | `sizeof`=8 | **Python `TypeError` 崩溃** | 否（非 CError） |

预期：位域值应截断/符号扩展到位宽，`sizeof` 应按位打包；或在不实现时明确拒绝。
实际：整型位域被当作普通 int 成员存取，值与布局均错，**无任何提示**。匿名/零宽位域更差：`make_struct` 以 `field.name=None` 作为字典键，随后 `Engine.integer_types()` 的 walk 执行 `name+'.'+field` 抛 `TypeError: can only concatenate str (not "NoneType") to str`（栈：`engine.py:344` / `engine.py:335`），异常未被包装成 `CError`，`line=None`、无错误步骤。

- 优先级：**最高（静默错误 + 崩溃）**；对应任务 2.1（Codex 实现或拒绝）与 2.2（dsh 复测）。
- 建议的最小修复顺序：先在解析/校验阶段对任意 `Decl.bitsize` 显式拒绝（含匿名、零宽），覆盖 `sizeof` 路径；再谈实现打包。

## B. 规模上限（审计项 2）— 阻断，数值已核实

代码定位（全部核实）：`engine.py:210` `ops>30000`；`engine.py:881` `len(steps)>=3000`；`engine.py:887` `trace_bytes>16000000`；`engine.py:726`/`1276` 数组与动态数组 `>1000`；`engine.py:1277` 动态分配 `>=200`；`engine.py:1538` `len(stack)>=80`；`engine.py:1930` 源码 `>50000`。

实测：

| 输入 | 结果 |
|---|---|
| `for(i=0;i<100;i++)s+=i;` | 通过，813 步，输出 `4950` |
| `for(i=0;i<370;i++)s+=i;` | 通过，2973 步，输出 `68265` |
| `for(i=0;i<380;i++)s+=i;` | 失败：`执行步骤超过 3000 步限制`（steps=3001） |
| `int a[1000];` | 通过 |
| `int a[1001];` | 失败：`数组元素总数无效或超过1000` |
| `f(79)` 递归 | 失败：`递归深度超过限制` |
| 201 次 `malloc(sizeof(struct N))` | **未触发 200 次分配上限**，在 1269 步先命中 `执行轨迹超过16MB限制`（`engine.py:887`） |

修正：审计写的“n≥100 循环、DP、全图遍历直接失败”偏保守——瓶颈是**每步深拷贝快照**（约 8 步/迭代），本机一次累加循环约在 370–380 次迭代间越界，而非一律 n≥100 失败。

补充确认：`web/app.js:34` 里的 `data.truncated||data.warning` 分支是**死代码**——`backend/*.py` 与 `server.py` 中 `truncated`/`warning` 零命中，`trace()` 返回键仅为 `exit_code/mode/output/preprocessed_source/status/steps/termination`。因此超限只有报错，没有“截断帧 + warning”这种可恢复形态。

- 优先级：高（教学场景常见规模即撞墙）；对应 1.4/3.1/4.4。

## C. union / goto（审计项 3）— 已有显式拒绝，描述需修正

| 输入 | 实际结果 | 行号 |
|---|---|---|
| `union U{int n;char c;};` | `CError: 首版暂不支持联合体`（`engine.py:1918`） | **`line=None`** |
| `goto skip; ... skip:` | `CError: 暂不支持语法：Goto` | `line=1` |
| `again: ... goto again;` | `CError: 暂不支持语法：Label` | `line=1` |

审计称“无 goto 处理”不准确：goto/label 走通用“不支持语法”拒绝，且带行号。真正的缺陷是 **union 的拒绝不带行号**（校验发生在 `Validator.visit` 阶段，异常无坐标）。

- 优先级：中（union 明确拒绝已满足 V1 范围要求，缺的是可定位性）；对应 2.3/2.5。

## D. 裸字节分配（审计项 4）— 成立

| 输入 | 实际结果 | 行号 |
|---|---|---|
| `malloc(4)` / `malloc(n)` | `CError: 动态分配需要 sizeof 类型描述`（`engine.py:1274`） | 1 |
| `malloc(sizeof(int)*2)` | 通过，12 步，输出 `5` | — |

明确拒绝、无静默误算；错误信息可再友好（提示需 `sizeof` 形式）。

## E. 库与格式（审计项 5）— 成立，但文档与代码不一致

均实测为显式拒绝且带行号：`%p` → `printf 暂不支持此格式或动态字段宽度`；`strtok` / `sprintf` → `不支持的函数：…`；`%[a-z]` → `scanf 支持整数、有限浮点、%c、%s 和 %Ns`。

反向发现：`%*d` 与 `%*.*d` **已实现**（实测 `[    3]`、`[    03]`；代码见 `engine.py:1491-1500`），而 `docs/COVERAGE.md:389` 仍写“动态宽度与数值格式动态精度仍未支持”，同文件 :394 又写已支持 → 文档自相矛盾且滞后。

## F. 诊断与文档（审计项 6）— 成立

- 语法错误：`int main(){ int y = ; }` → `ParseError: : Invalid expression`，**`line=None`**，无 `steps`。`server.py:21` 用 `getattr(e,'line',None)` 原样透出 → 前端拿不到行号。
- 语义错误一般带行号（如 `未定义变量：z` → line=1），但校验阶段错误（union）与匿名位域崩溃不带行号。
- 文档数字：见上文“基线与测试证据”。`README.md:63` 正确；`docs/COVERAGE.md:19` 的 370/85 需更新为 535/103。

- 优先级：P0（审计本身将其列入 P0 门槛）；对应 2.3、2.4、1.4。

## 未验证 / 仅为推断

1. “任意 C 源码兼容性不足”属定性结论，未做随机语料差分测试。
2. 前端回放、分页、对象图、断点等界面行为本次未跑浏览器用例（依赖 CDP，属 1.3/4.3）。
3. 性能与内存占用未做基准测试（属 3.1）；仅观测到 16MB 轨迹上限先于分配数上限触发。
4. `ops>30000`（`engine.py:210`）是否会被优先触发未单独构造用例。

## 对下游任务的影响

- 2.1 的实现目标应明确为“先拒绝、后实现”，且拒绝必须覆盖：具名/匿名/零宽位域、`sizeof`、初始化列表、赋值截断。
- 2.2 的复测用例应包含本文 A 表全部 7 行 + 匿名零宽崩溃。
- 2.3 需要把 `ParseError` 的行号与 union/Validate 阶段的错误补上结构化 `line`。
- 1.4 需要同步 COVERAGE 的 370→535、85→103，并删除 :389 的过期表述；同时决定 app.js 的 truncated 分支是删除还是由后端补齐。
- 3.1/4.4 应以“每步快照体积”为主要约束建模，而非仅以步数上限衡量。
