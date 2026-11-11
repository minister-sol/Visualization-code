# 任务 2.2：位域拒绝的独立复测

- 复测对象：任务 2.1（Codex）在 `backend/engine.py` 解析后新增的 `RejectBitfields` AST 遍历。
- 执行者：dsh；日期：2026-11-11。
- 结论：**26/26 用例通过**。具名、匿名、零宽、嵌套、局部、typedef、数组、初始化、指针、typedef 整型、static 存储类等 22 个位域形态全部在**执行前**抛出 `CError('暂不支持位域')`，带正确行号，无 `TypeError`、无部分执行、无静默输出；4 个合法程序未被误伤。**建议验收 2.1。**
- 复现：`python probes/verify_2_2_bitfields.py`（退出码 0 即通过）；探针有效性：`python probes/verify_2_2_mutation.py`（退出码 0）。

## 环境与基线

Python 3.12.10、Node v24.20.0、GCC 16.2.0；分支 `main`，HEAD `2d990d6`；工作区含 Codex 未提交改动（`backend/engine.py` +9 行、`tests/test_bitfield_rejection.py` 新增）。

## 复测范围（不依赖 Codex 的 `tests/test_bitfield_rejection.py`）

`probes/verify_2_2_bitfields.py` 自行构造 26 个用例，直接调用 `backend.engine.trace`：

| 组 | 用例 | 期望 | 实际 |
|---|---|---|---|
| 具名位域 | R01 全局结构体 `int a:3`；R02 `int a:3; int b:5` | 拒绝，line=2 | CError 位域，line=2 |
| 匿名/零宽 | R03 `int :3`；R04 `:0` 夹在具名之间；R05 仅 `int :0` | 拒绝，line=2 | CError 位域，line=2（不再 TypeError） |
| 嵌套 | R06 内层含位域；R07 嵌套且被赋值使用；R13 匿名结构体成员内含位域 | 拒绝，line=1 | CError 位域，line=1 |
| 位置变体 | R08 函数内局部结构体（line=2）；R09 typedef 结构体（line=2）；R16 先合法后位域（line=2）；R21 typedef 整型作位域类型（line=2）；R22 `static` 存储类（line=1） | 拒绝，对应行号 | 全部符合 |
| 使用形态 | R10 结构体数组；R11 初始化列表；R12 结构体指针成员；R19 `s.a=9` 赋值 | 拒绝，line=1 | 全部符合 |
| 曾静默误算 | R17 `unsigned char c:1`（曾赋 2 得 2，GCC 为 0）；R02 `sizeof` 曾为 8（GCC 4） | 拒绝 | 全部拒绝，无法再产生错误数值 |
| 行号偏移 | R14 `#include <stdio.h>` 后（源头第 3 行）；R15 `#define` + 空行后（源头第 4 行） | 拒绝且行号为源头行号 | line=3 / line=4，无偏移 |
| 组合语法 | R23 `union` 内含位域 | 显式拒绝 | CError 位域，line=1（union 行号问题归 2.5） |
| 不误伤 | A01 普通结构体 `sizeof=8`；A02 三元冒号；A03 `switch/case` 冒号；A04 注释/字符串中的 `int a:3;` | 正常执行 | exit=8/2/2/105 |

每次拒绝还断言：异常类型恰为 `CError`（非 `TypeError` 等）、消息含“位域”、`steps` 为空、`output` 为空。

## 探针有效性（变异测试）

`probes/verify_2_2_mutation.py` 复制 `backend/engine.py`、删除 `RejectBitfields` 的 6 行调用生成临时模块 `backend/_mut_engine.py`（跑完即删），再对同一批 must-reject 用例求值：

- 22 个 must-reject 用例中仅 **1 个**（R20 union）仍被旧有 union 检查拒绝，其余 **21 个全部静默执行**（例：`sizeof` 位域结构体 exit=8、`s.a=9` 返回 9、`o.in.a=9` 返回 9）。
- 说明：通过并非来自其他检查的巧合，探针确实度量了 2.1 的新增行为。

## 端到端（HTTP API）

启动 `python server.py --port 8077`，POST `/api/trace` 提交位域程序，返回：

```
HTTP 400
{"error":"暂不支持位域","status":"error","line":2,"steps":[],"output":"","preprocessed_source":""}
```

`line=2` 已透出给前端；`steps` 为空证明没有部分执行。

## 回归

| 命令 | 结果 |
|---|---|
| `python -m unittest discover -s tests` | **Ran 536 tests / OK**（12.75s；含 Codex 新增的 1 项位域测试） |
| `node tests/test_object_layout.cjs` | 全部 passed |
| `node tests/test_state_view.cjs` | 全部 passed |
| `python tests/compare_gcc.py` | exit 0，103 段 GCC 输出一致 |

注：Codex 记录中 5 个 `test_http` 失败源于其沙箱禁止本机连接（WinError 10013）；本环境为非受限访问，HTTP 测试实跑通过。

## 残余问题与建议

1. **仅拒绝、未实现语义**：位域尚无正确布局/截断/符号扩展能力；`docs/COVERAGE.md` 与 README 必须保持“明确拒绝”的表述，不能在后续文档中写成“支持位域”。完整实现属 V1 之后（计划文件“后续版本候选”）。
2. 拒绝时 `CError` 未携带 `steps` 与 `preprocessed_source`（对比运行错误 `line=1/steps=3/pre_src=39`），前端只能显示消息与行号。归 2.3/2.4 决定是否补。
3. `union` 单独拒绝仍无行号（`首版暂不支持联合体`）；`union` 内含位域时因遍历在前可得行号。归 2.5。
4. Codex 的 `tests/test_bitfield_rejection.py` 只覆盖 4 种形态且断言 `line==2`；本次复测覆盖更广，可作为其补充证据，但两者均不覆盖位域语义正确性（因为尚未实现）。
