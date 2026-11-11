# CodeLens V1.0 执行与交接计划

> **所有执行者必读**：每次开始任务前先阅读本文件和最近交接记录。认领任务时更新状态；完成任务、阶段或暂停时写入交接记录。若使用 Git 并行协作，先同步最新内容，解决记录冲突后再提交。不要将计划或历史测试结果视为实际完成证明。

**目标**：交付可通过 HTTPS 域名访问的受限 C 数据结构教学可视化网站，提供可信执行、回放、明确错误提示和部署文档。

**基线**：Git 提交 `2d990d6`；2026-11-11 曾通过 535 项 Python 测试及 `test_object_layout.cjs`、`test_state_view.cjs`。结果仅代表当时环境和版本。审计参考 `docs/ROADMAP_AUDIT.md`；范围与实际代码冲突时重新验证。

**架构**：浏览器通过 HTTPS 访问网站和 API；后端在受限执行环境生成轨迹。当前 `server.py` 仅监听本机，不能直接作为公网生产服务。具体隔离和部署方案须经安全验证后确定。

**技术栈**：Python 3.12、内置 pycparser、原生 JavaScript、HTML/CSS；现有 unittest 和 Node 测试。生产运行时、隔离方案、主机及域名待确认。

## 开工和交接规则

1. 开始前阅读本文件、相关审计、当前 Git 状态和最近交接记录；确认任务负责人、前置条件及是否有人正在修改同一文件。
2. 先在任务表标为“进行中”，写执行者和日期；发现依赖未完成或范围不清时记录阻碍，不伪造完成。
3. 每项工作先编写能证明行为的测试或复现步骤，再实现、验证并记录结果；不支持的能力须明确报错，不能产生已知静默错误。
4. 完成任务及阶段时更新复选框、状态和交接记录，写明提交、文件、测试命令及结果、剩余风险；测试未运行时说明原因。
5. dsh 独立复核重要语义和安全问题；Copilot 负责界面及浏览器自动化；Codex 负责后端、集成与部署。负责人可协调具体文件，避免同时修改同一处。
6. 按需创建分支和 PR；未经明确授权不购买服务、修改域名或发布正式环境。不要在本文件记录密钥、密码或用户源码。

**状态**：未开始 / 进行中 / 阻塞 / 待验收 / 已完成。只有验收证据满足条件才能标记“已完成”。日期统一使用 `YYYY-MM-DD`。

## 范围与验收边界

- V1 包含单文件 C 输入、标准输入、输出和运行错误、回放、断点、数组/矩阵/对象图/调用栈展示，以及常见教学数据结构样例。
- V1 不承诺完整 C 标准。位域在正确实现前必须明确拒绝；`union`、`goto`、裸字节 malloc、多文件及完整预处理器不作为 V1 必须实现的功能，但应明确告知限制。
- 域名、服务器、预算、面向地区和预期并发尚未确定；不得将“公网可访问”标为完成，直到使用真实域名从两台不同电脑、两个独立网络通过 HTTPS 完整运行并回放。
- 不以测试数量推算完成率。执行规模和性能指标须经基准测试后确定，不直接承诺审计的扩容目标。

## 任务清单

### 阶段 1：基线与任务协调

| ID | 负责人 | 状态 | 任务与完成证据 |
|---|---|---|---|
| 1.1 | Codex | 阻塞（2026-11-11，HTTP 测试受沙箱网络限制） | 在当前版本运行 `python -m unittest discover -s tests -v`、`node tests/test_object_layout.cjs`、`node tests/test_state_view.cjs`；记录环境、命令和结果。 |
| 1.2 | dsh | 待验收（2026-11-11 执行者 dsh，证据见 `docs/AUDIT_RECHECK_1_2.md`，复现脚本 `probes/audit_1_2_probe.py`） | 逐项复核 `docs/ROADMAP_AUDIT.md` 的阻断项，提供最小输入、实际结果、预期结果和优先级，区分已验证与推断。 |
| 1.3 | Copilot | 待验收（2026-11-11，复核证据见 `docs/COVERAGE.md`） | 清点 `tests/browser_*.mjs` 的运行依赖、命令、覆盖范围与缺口，给出可复现说明。 |
| 1.4 | Codex | 待验收（2026-11-12，本地检查通过，CI 待运行） | 建立可复现的自动检查，明确 Python、Node 和 GCC 可选依赖；同步 README 与覆盖文档中的测试统计和限制。 |

**阶段门槛**：1.1–1.4 均有证据；失败项有明确负责人和处理计划。

### 阶段 2：正确性与错误提示

| ID | 负责人 | 状态 | 任务与完成证据 |
|---|---|---|---|
| 2.1 | Codex | 待验收（2026-11-11；dsh 已于 2.2 独立复测通过，见 `docs/VERIFY_2_2_BITFIELDS.md`，建议验收） | 为位域读取、赋值和 sizeof 建立复现与回归；完整语义实现前在解析或执行前明确拒绝位域，并保留可定位错误。涉及 `backend/engine.py` 与对应测试。 |
| 2.2 | dsh | 待验收（2026-11-11 执行者 dsh，证据见 `docs/VERIFY_2_2_BITFIELDS.md`，复现脚本 `probes/verify_2_2_bitfields.py`） | 独立复测 2.1，检查嵌套结构体及匿名/零宽位域不会静默执行；记录证据。 |
| 2.3 | Codex | 未开始 | 为语法错误、预处理错误、运行错误和超限设计并验证结构化响应；检查 `server.py` 和解析异常，尽可能返回正确行号及已有轨迹。 |
| 2.4 | Copilot | 未开始 | 在 `web/app.js`、`web/index.html` 和必要样式中展示错误原因、可用行号与回放状态；添加浏览器验收。 |
| 2.5 | dsh | 未开始 | 针对 union、goto、裸 malloc 和其他未支持写法验证明确报错，报告任何静默误算；Codex 修复后复测。 |

**阶段门槛**：2.1–2.5 完成；不支持功能清单与实际行为一致，已知静默错误未遗留。

### 阶段 3：公网安全与部署

| ID | 负责人 | 状态 | 任务与完成证据 |
|---|---|---|---|
| 3.1 | Codex | 未开始 | 测量正常与极端输入的 CPU、内存、响应时间及并发，提出基于部署资源的运行限制和隔离设计。 |
| 3.2 | Codex | 未开始 | 实现受限执行进程/容器及超时终止、内存与并发上限、请求大小限制和清理；测试死循环、超大输入、并发耗尽与异常退出。不得依赖解释器步数限制作为唯一隔离。 |
| 3.3 | dsh | 未开始 | 独立审查执行隔离、资源耗尽、输入处理、日志泄漏、错误信息和配置；复测 3.2，记录残余风险。 |
| 3.4 | Codex | 未开始 | 准备部署配置、HTTPS 反向代理、健康检查、服务重启、日志、限流及回滚说明；先在测试环境验证。 |
| 3.5 | Copilot | 未开始 | 处理请求超时、网络中断、服务不可用和重复提交时的前端反馈，并加入浏览器验证。 |
| 3.6 | Codex | 阻塞 | 在用户提供域名、DNS 权限、服务器/平台、预算和地区后配置正式部署；实际变更按用户授权执行并验证证书与 DNS。 |

**阶段门槛**：3.1–3.6 均有证据；公网测试显示超限请求得到控制，服务可恢复，安全审查无未接受的高危问题。

### 阶段 4：数据结构与体验验收

| ID | 负责人 | 状态 | 任务与完成证据 |
|---|---|---|---|
| 4.1 | dsh | 未开始 | 准备数组、矩阵、链表、栈、队列、树、图、指针别名、释放及错误各类样本，记录输出、关键轨迹和预期视图。 |
| 4.2 | Codex | 未开始 | 按 4.1 修复引擎问题；有可用 GCC 时对照适用样本输出及退出码，另核对关键中间状态。 |
| 4.3 | Copilot | 未开始 | 检查分页、矩阵定位、对象图、调用栈、断点和回放；加入自动化浏览器用例并记录运行环境。 |
| 4.4 | Codex | 未开始 | 依据 3.1 结果明确 V1 最大输入与轨迹规模；超限提示及可恢复行为有测试，不未经测量提高限制。 |

**阶段门槛**：约定样本输出、关键状态、界面及回放通过；超限行为和限制文档一致。

### 阶段 5：交付

| ID | 负责人 | 状态 | 任务与完成证据 |
|---|---|---|---|
| 5.1 | Copilot | 未开始 | 更新使用指南、示例、支持范围、限制、错误处理及浏览器测试说明。 |
| 5.2 | Codex | 未开始 | 整理部署、配置、升级、监控、回滚和故障排查文档；不得包含凭据。 |
| 5.3 | dsh | 未开始 | 独立运行验收清单，提供版本号、环境、测试结果、缺陷和是否建议发布。 |
| 5.4 | Codex | 阻塞 | 完成正式部署及跨两台电脑、两个独立网络的 HTTPS 访问、运行和回放验证；记录域名、时间和结果，不记录用户隐私。 |
| 5.5 | Codex | 未开始 | 汇总已完成事项、已知限制、测试结果、运行费用/责任人和后续工作，形成交付记录。 |

**阶段门槛**：5.1–5.5 完成，用户可从独立设备通过域名使用网站；遗留问题明确列出。

## 后续版本候选，不属于 V1 交付承诺

由 Codex 主导设计、dsh 制定兼容性和差分测试、Copilot 配合界面：增量快照与扩容；union、位域、goto；裸字节内存、`%p` 和更多库；自定义头文件、多文件、`argc/argv`；密集图布局。每项需先确定语义、性能目标和验收标准，独立排期。

## 交接记录

### 2026-11-12：任务 1.4 验收检查 — Codex

- 状态：检查暂停，1.4 保持待验收。
- 证据：检查 `scripts/check.py` 与 `.github/workflows/checks.yml`；统一入口包括 Python、Node 和可选 GCC，工作流指定 Python 3.12、Node 24 并启用 GCC。当前 HEAD 为 `2d990d6`，脚本及工作流仍未跟踪，不能据此确认远端 CI 已运行。
- 本次未重跑完整检查；现有交接记录称用户本地 `python scripts/check.py --gcc` 通过。后续需提交相应改动并核对该提交的远端 CI 结果。


### 2026-11-12：统一检查本地验证 — 用户 / Codex

- 用户提供的 PowerShell 截图显示 `python scripts/check.py --gcc` 最终输出 `All selected checks passed.`，且展示 GCC 对照结果；截图未显示各测试数量。此前沙箱回环限制仅影响 Codex 环境。
- 用户授权整理、提交并推送；1.4 等待远端 CI 结果后验收。


### 2026-11-11：任务 2.2 位域拒绝独立复测 — dsh

- 任务 ID / 状态：2.2，待验收（dsh 自执行，建议由 Codex 或另一执行者验收）；同时建议验收 2.1。
- 完成内容及文件：新增 `docs/VERIFY_2_2_BITFIELDS.md`（复测报告）、`probes/verify_2_2_bitfields.py`（26 用例探针，退出码 0 即通过）、`probes/verify_2_2_mutation.py`（变异测试，证明探针有效）。未修改 `backend/`、`server.py`、`web/`。
- 验证命令与实际结果：
  - `python probes/verify_2_2_bitfields.py` → 26/26 通过（22 个位域形态全部 `CError` + 正确行号 + `steps`/`output` 为空；4 个合法程序未被误伤）
  - `python probes/verify_2_2_mutation.py` → 删除 `RejectBitfields` 后 22 个 must-reject 用例中 21 个静默执行（仅 union 组合仍被旧检查拒绝），证明探针确实度量 2.1 行为
  - `python -m unittest discover -s tests` → Ran 536 tests / OK（12.75s）
  - `node tests/test_object_layout.cjs`、`node tests/test_state_view.cjs` → 全部 passed
  - `python tests/compare_gcc.py` → exit 0，103 段一致
  - HTTP 端到端：`server.py --port 8077` + POST `/api/trace` 提交位域程序 → 400，`{"error":"暂不支持位域","line":2,"steps":[],"output":""}`
  - 覆盖形态：具名、匿名 `int :3`、零宽 `int :0`、嵌套（含被实际使用）、函数内局部、typedef 结构体、typedef 整型位域类型、结构体数组、初始化列表、指针成员、`static` 存储类、匿名结构体成员、`s.a=9` 赋值、`#include`/`#define` 后行号（源头 line=3 / line=4 无偏移）
- 提交或 PR：无（工作区未提交；`docs/EXECUTION_PLAN.md`、`docs/VERIFY_2_2_BITFIELDS.md`、`probes/` 未跟踪）。
- 阻碍、已知风险和未完成内容：
  1. 位域仅被拒绝、语义未实现；文档须继续表述为“明确拒绝”，不得写成支持。
  2. 拒绝时 `CError` 无 `steps` 与 `preprocessed_source`（运行错误则有），前端只能显示消息与行号，归 2.3/2.4 决定是否补。
  3. 单独 `union` 拒绝仍无行号；`union` 内含位域时可得行号，归 2.5。
  4. 本环境非受限访问，536 项测试全通过；Codex 记录的 5 个 `test_http` 失败是其沙箱 WinError 10013 所致，不构成代码缺陷。
- 下一步及接手人：Codex 验收 2.1、2.2 后进入 2.3（结构化错误响应与行号）；dsh 随后做 2.5（union/goto/裸 malloc 明确报错复测）；2.4（Copilot）展示错误原因与行号。

### 2026-11-12：任务 1.4 自动检查与文档 — Codex

- 状态：待验收；新增 `scripts/check.py` 和 `.github/workflows/checks.yml`，同步 README 与覆盖文档，保留 Copilot 的 1.3 记录。
- 验证：`python scripts/check.py` 运行 536 项 Python 测试，其中 5 项 HTTP 测试因 WinError 10013 禁止本机连接而失败；两项 Node 测试通过，入口返回 1 且列出失败。`python scripts/check.py --gcc` 同样返回 1，GCC 对照 103 项通过（临时目录设在工作区）；未提供 `--gcc` 时明确提示跳过。Python 3.12.10、Node 24.20.0、GCC 16.2.0。
- 限制：GitHub Actions 尚未在远端运行；须在允许回环网络的环境运行统一检查并确认 CI，再验收 1.4。浏览器测试不属于统一检查，仍按 1.3 前置条件单独运行。未提交。


### 2026-11-11：1.1、1.2 独立复验与 2.1 — Codex

- 1.1 阻塞：Windows、Python 3.12.10、Node v24.20.0、GCC 16.2.0；`python -m unittest discover -s tests -v` 运行 536 项，5 个 `test_http` 出错（沙箱禁止本地连接 WinError 10013），其余通过；两项 Node 测试均通过。不得标记完成。
- 1.2 保持待验收：独立运行 `python tests/compare_gcc.py`，103 条一致；GCC 实测位域 sizeof=4、赋 7 得 -1、赋 9 得 1、零宽结构 sizeof=8。重跑 probe；位域现已拒绝，历史崩溃无法在修复后复现；报告其他额外 GCC 位域样本未逐项复验。
- 2.1 待验收：解析后遍历原始 AST，拒绝所有 Decl.bitsize，错误带行号；新增 `tests/test_bitfield_rejection.py`，具名、匿名、零宽、嵌套用例通过。完整测试中 HTTP 项受限；需在允许本地连接的环境重跑并由 dsh 执行 2.2 独立复测。
- 未提交；`docs/COVERAGE.md` 为已有工作区修改，未改动。


新增记录请置顶，保留历史；并行时按时间和执行者分别追加，不覆盖其他人的记录。

### 2026-11-11：任务 1.2 交接检查 — Codex

- 状态：交接检查完成；1.2 保持待验收，尚未独立重跑报告中的全部 GCC 和测试证据。
- 验证：阅读复核报告并运行 `python probes/audit_1_2_probe.py`，退出码 0；复现位域静默错误、解析错误缺行号及规模限制。匿名位域崩溃及 GCC 对照未在本次独立复验。
- 下一步：Codex 完成 1.1 和 1.2 独立验收，优先实施 2.1；Copilot 开展 1.3。

### 2026-11-11：任务 1.2 审计阻断项复核 — dsh

- 任务 ID / 状态：1.2，待验收（dsh 自执行，建议 Codex 或另一执行者验收）。
- 完成内容及文件：新增 `docs/AUDIT_RECHECK_1_2.md`（6 类阻断项逐条复核：最小输入、GCC 对照、实际结果、优先级、已验证/推断）；新增 `probes/audit_1_2_probe.py`（只读复现脚本）。未修改 `backend/`、`server.py`、`web/` 任何代码。
- 验证命令与实际结果：
  - `python -m unittest discover -s tests` → `Ran 535 tests in 12.030s / OK`
  - `node tests/test_object_layout.cjs`、`node tests/test_state_view.cjs` → 全部 passed
  - `python tests/compare_gcc.py` → exit 0，103 条 GCC 输出/状态一致
  - `python probes/audit_1_2_probe.py` → 20 个用例的实际记录（位域/规模/union/goto/malloc/格式/解析错误）
  - GCC 16.2.0 对照位域样本：`sizeof{int a:3;int b:5;}`=4、`int a:3` 赋 7→-1、赋 9→1、`unsigned char c:1` 赋 2→0
- 提交或 PR：无（工作区未提交；`AGENTS.md`、`docs/EXECUTION_PLAN.md`、`docs/AUDIT_RECHECK_1_2.md`、`probes/` 均为未跟踪文件）。是否需要提交请负责人授权。
- 阻碍、已知风险和未完成内容：
  1. 位域静默误算仍在，且**匿名/零宽位域触发未捕获 `TypeError`**（`engine.py:344`/`:335`，`field.name=None` 作字典键），优先级最高。
  2. 解析错误 `ParseError` 无行号；union 拒绝无行号（goto/label 有行号）。
  3. 审计有两处描述不准确：`goto` 已显式拒绝（非“无处理”）；“n≥100 循环失败”实测为约 370–380 次迭代才越过 3000 步。
  4. `docs/COVERAGE.md:19` 的“370 项 / 85 段”过期（实为 535 / 103）；`:389` 称动态宽度不支持，与 `engine.py:1491-1500` 实际支持矛盾。
  5. `web/app.js:34` 的 `truncated/warning` 分支为死代码（后端零实现）。
  6. 前端浏览器用例、性能基准、任意 C 兼容性未验证（属 1.3/3.1/4.3）。
- 下一步及接手人：2.1（Codex）按“先显式拒绝、后实现”修复位域，拒绝范围须含具名/匿名/零宽、`sizeof`、初始化与赋值；2.3 补 `ParseError` 与校验阶段错误的行号；1.4（Codex）同步文档统计。2.2（dsh）在 2.1 完成后按 `docs/AUDIT_RECHECK_1_2.md` 的 A 表逐行复测。

### 2026-11-11：计划建立 — Codex

- 状态：计划已建立；各开发阶段尚未开始。
- 依据：`docs/ROADMAP_AUDIT.md`、`README.md` 和当前 `server.py`；历史基线为提交 `2d990d6`。
- 外部依赖：域名、DNS、服务器、预算、主要访问地区及预期并发未确认。
- 下一步：执行阶段 1，先认领任务并记录最新基线；不得假定部署资源已就绪。

### 交接记录

### 2026-11-12：任务 1.4 验收检查 — Codex

- 状态：检查暂停，1.4 保持待验收。
- 证据：检查 `scripts/check.py` 与 `.github/workflows/checks.yml`；统一入口包括 Python、Node 和可选 GCC，工作流指定 Python 3.12、Node 24 并启用 GCC。当前 HEAD 为 `2d990d6`，脚本及工作流仍未跟踪，不能据此确认远端 CI 已运行。
- 本次未重跑完整检查；现有交接记录称用户本地 `python scripts/check.py --gcc` 通过。后续需提交相应改动并核对该提交的远端 CI 结果。
模板

```text
日期与执行者：
任务 ID / 状态：
完成内容及文件：
验证命令与实际结果：
提交或 PR：
阻碍、已知风险和未完成内容：
下一步及接手人：
```

### 2026-11-11：任务 1.3 浏览器依赖与覆盖复核 — Copilot

- 任务 ID / 状态：1.3，待验收。
- 完成内容及文件：清点 `tests/browser_*.mjs` 共18个脚本；在 `docs/COVERAGE.md` 补充运行依赖、覆盖主题、复现命令约束和缺口。
- 环境证据：Python 3.12.10、pycparser 3.12、Node 24.20.0、GCC 16.2.0 可用；未发现 Playwright/Puppeteer，也不需要 npm 依赖。`python server.py` 启动后，GET `/api/examples` 返回200，POST `/api/trace` 对 `int main(){return 0;}` 返回200和完成轨迹。
- 验证命令与实际结果：`python -m unittest discover -s tests -v` → `Ran 535 tests ... OK`；`node tests/test_object_layout.cjs` 与 `node tests/test_state_view.cjs` → passed；`python tests/compare_gcc.py` → 103段对照通过。`node tests/browser_conditions.mjs` 未进入断言，因 `http://127.0.0.1:9223/json/list` 无 CDP 服务而退出 `ECONNREFUSED`。
- 阻碍、已知风险和未完成内容：当前机器没有可复现的 CDP 浏览器前置；18个浏览器脚本本次均未运行。尚缺统一 runner、无头浏览器启动步骤、移动端/可访问性/跨浏览器矩阵、性能/并发和网络中断验证。
- 下一步及接手人：由负责人验收1.3；如需浏览器证据，先提供或启动带9223（或通过 `CDP_URL` 指定）的 Chromium/Edge，再批量执行脚本。



