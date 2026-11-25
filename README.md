# CodeLens · 经典算法与数据结构

冒泡排序的一次交换改动了哪两个数？BFS 下一步会访问哪个顶点？CodeLens 把 77 个经典主题拆成可回放的步骤，让你对照代码、图示和变量，看到每一步如何改变结果。

![CodeLens 桌面实景：左侧选择冒泡排序并编辑输入，右侧控制播放速度和进度](docs/codelens-desktop.png)

## 下载安装包（1.1.0）

桌面版内嵌完整离线站点，包含 77 个算法主题（C99 / C++17 / Java 三种源码视图）与 66 项 C 标准库函数教学，断网可用。

| 平台 | 安装包 | 系统要求 |
|---|---|---|
| Windows x64 | [CodeLens-Setup-1.1.0-x64.exe](https://github.com/minister-sol/Visualization-code/releases/download/v1.1.0/CodeLens-Setup-1.1.0-x64.exe) | Windows 10 / 11 x64 |
| Ubuntu amd64 | [codelens-desktop_1.1.0_amd64.deb](https://github.com/minister-sol/Visualization-code/releases/download/v1.1.0/codelens-desktop_1.1.0_amd64.deb) | Ubuntu 22.04 及以上（依赖 GTK3、NSS、ALSA 等） |
| CentOS x86_64 | [codelens-desktop-1.1.0-1.x86_64.rpm](https://github.com/minister-sol/Visualization-code/releases/download/v1.1.0/codelens-desktop-1.1.0-1.x86_64.rpm) | CentOS Stream 9 x86_64 |

SHA-256 校验值（下载后逐条比对；Release 附带的校验文件为 Windows 换行，Linux 上建议直接照下表核对）：

```
be4d63cfa1ccff55074c6b5ba959a6ba4ca26dc6f4c8e00c03e286ed1b36155a  CodeLens-Setup-1.1.0-x64.exe
82cef59761cf2ab7798b0952115e1b8e9708cd890d3ca859e22c85c1f913fa93  codelens-desktop_1.1.0_amd64.deb
3977031c1ae0383bd59784f50ecf4f950a89bc84a76bdaa116a825b80764f8ca  codelens-desktop-1.1.0-1.x86_64.rpm
```

安装包暂未代码签名，Windows 首次运行可能提示“未知发布者”。构建、验证与上线记录见 [docs/RELEASE_1.1.0_20261125.md](docs/RELEASE_1.1.0_20261125.md)。

### 用 GPG 校验下载

发布密钥指纹：

```
761F CD89 CAA6 6C7C 133C  3064 96AB F23B D88A 747B
```

1. 导入公钥（[release/CodeLens-release-key.asc](release/CodeLens-release-key.asc)）：

   ```sh
   gpg --import CodeLens-release-key.asc
   ```

2. 校验清单签名：Release 上的 `SHA256SUMS-1.1.0.txt` 与仓库里的 [release/SHA256SUMS-1.1.0.txt.asc](release/SHA256SUMS-1.1.0.txt.asc) 配套使用（Linux / macOS，Windows 用 GnuPG 同样适用）：

   ```sh
   curl -LO https://github.com/minister-sol/Visualization-code/releases/download/v1.1.0/SHA256SUMS-1.1.0.txt
   curl -LO https://raw.githubusercontent.com/minister-sol/Visualization-code/codex/c-standard-library/release/SHA256SUMS-1.1.0.txt.asc
   gpg --verify SHA256SUMS-1.1.0.txt.asc SHA256SUMS-1.1.0.txt
   ```

   应输出 `Good signature from "CodeLens Release (zhongjing)"`。

3. 比对安装包：

   ```sh
   tr -d '\r' < SHA256SUMS-1.1.0.txt | sed -E 's#([0-9a-f]{64}).*/([^/]+)#\1  \2#' | sha256sum -c
   ```

   Windows 可用 `Get-FileHash <文件> -Algorithm SHA256` 对照上面的表格。

签名文件位于 [release/](release/)；签名内容就是 Release 上同名校验文件的原字节，因此 `gpg --verify` 在任何平台都能复现。

## Code signing policy

Free code signing provided by SignPath.io, certificate by SignPath Foundation（申请中，尚未生效）。

- Committers and reviewers: zhongjing（本仓库唯一维护者，提交权限见 https://github.com/minister-sol ）
- Approvers: zhongjing
- 构建来源：安装包只在公开仓库源码上构建，签名只作用于本次构建产物，不对第三方二进制签名。
- 当前状态：Windows 安装包尚未 Authenticode 签名；Linux 包的 SHA-256 清单由项目 GPG 密钥（指纹见上）分离签名。
- 隐私政策：This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it. 桌面版内嵌离线站点，无遥测、无自动更新回传。

## 第一次回放 · 跟着最大的数走一轮

1. 在仓库根目录运行下面的命令，再打开 [本地 CodeLens](http://127.0.0.1:8000/)。

   ```sh
   python -m http.server 8000 --bind 127.0.0.1 --directory web
   ```

2. 选择 **冒泡排序**，保留示例 `5, 2, 4, 2, 1`，点击 **生成步骤**。
3. 选择 **并排显示**，用 **下一步** 跟踪数字 5。第一轮结束时，数组变为 `2, 4, 2, 1, 5`。拖动时间轴回看最后一次交换，对照当时高亮的代码行。

本地启动需要 Python 3。静态主站在浏览器中生成步骤。

## 选一个想看懂的问题

| 想观察什么 | 打开主题 | 回放时留意 |
| --- | --- | --- |
| 指针如何改变链表 | 单链表反转操作 | 每次修改 next 后，prev 和 curr 分别指向哪里 |
| 图中如何找到最短路 | BFS、无权最短路径 | 顶点首次被发现时的前驱和距离 |
| 一个选择如何影响后续结果 | 0/1 背包 | 当前物品放入和跳过时，表格中的值怎样变化 |
| 匹配失败后从哪里继续 | KMP | 模式串失配时，前缀表如何决定回退位置 |

## 输入格式与验收记录

首版目标环境为 Windows 11 桌面 Microsoft Edge，覆盖桌面和 390px 窄窗口代表路径。各主题的验证范围与浏览器缺口见 [逐主题验收矩阵](docs/V1_EVIDENCE_MATRIX.md)。

<details>
<summary>展开各主题的输入语法、边界条件与验证命令</summary>

使用搜索框或分类目录选择主题。每个主题显示默认输入示例和限制；编辑后点击“生成步骤”，可逐步前后移动、播放/暂停、拖动时间轴或重置。“恢复当前主题示例”可恢复可运行输入；输入无效时页面清空旧轨迹，修正后重新生成。所有控件均可通过键盘聚焦。排序接受最多 20 个 -999 至 999 的整数，以逗号或空白分隔；空白为空数组。栈接受最多 50 行 `push 整数` 或 `pop`，空栈出栈显示提示且不改变状态。数组主题首行为初始整数，后续每行 `insert 索引 整数` 或 `delete 索引`，最多 20 项、50 条操作；循环队列首个非空行为 `capacity 容量`（1–20），后续 `enqueue 整数` 或 `dequeue`，最多 49 条操作。操作空行和数组首尾空分隔符会忽略，整数范围均为 -999 至 999。代码只读；高亮对应当前步骤，状态显示该步骤执行后的快照（条件判断显示判断时状态）；无对应代码行的说明步骤明确标注。循环队列显示物理槽位、队头及长度；插入排序展示暂存的 key。非法输入会清除旧轨迹并禁用回放。

单链表首行为初始值（空链表须保留空首行），后续每行 `insert 索引 值`、`delete 索引` 或 `reverse`，最多 20 个节点和 50 个操作。节点按创建顺序显示，编号、next、head、prev 和 curr 表示真实引用；反转中未连接的节点仍可见。线性和二分查找的首行为数组（可空），第二行为 `target 整数`；二分查找要求升序，重复值返回首个匹配索引，未找到为 -1。归并排序显示暂存区与区间；快速排序使用末尾元素作基准，显示区间与基准。

哈希表选择链地址或线性探测，首行 `capacity 容量`（1–20），其余每行 `insert 值`、`find 值` 或 `delete 值`，最多 49 条操作；散列使用非负取模，重复值不插入，线性探测的 `deleted` 为保留探测链的墓碑。二叉搜索树每行使用同样三种操作，最多 20 个节点、50 条操作，重复值不插入；节点卡片标明左右引用。大顶堆输入 `insert 值` 或 `pop`，允许重复值，最多 20 个元素和 50 条操作；堆排序输入整数数组。堆视图按数组索引标明父子索引及已排序部分。所有整数范围均为 -999 至 999。

二叉树前序、中序、后序与层序遍历接受按完整二叉树数组索引排列的层序位置，`null` 或 `#` 为空节点，最多 31 个位置；非空节点的父节点必须存在，空输入为空树。双指针首行输入升序数组、第二行 `target 整数`，返回一组不同索引或未找到。滑动窗口第二行 `size 长度`，计算定长窗口最大和，空数组无合法窗口。前缀和第二行 `range 左索引 右索引`，查询闭区间，空数组无合法查询；其他数组最多 20 个整数，范围 -999 至 999。

图主题包括邻接表、DFS、BFS、无权最短路径和拓扑排序。每行分别使用 `vertices A B C`、`mode directed` 或 `mode undirected`、`start A`、`edge A B`；顶点名以英文字母开头，最多 8 位字母/数字/下划线，最多 12 顶点、30 边。允许自环，重复边报错；无向图反向重复也算重复。DFS/BFS/最短路径在非空图必须指定起点，只探索其可达部分；空图不指定起点。邻接点按顶点声明顺序访问；拓扑排序只接受有向图，初始零入度队列按声明顺序、后续按邻接顺序加入，有环时明确提示。最短路径按 BFS 首次发现确定前驱，未到达顶点距离及路径为空。图形顶点填色显示已访问，橙色标出当前顶点，面板显示邻接表、栈/队列、距离路径或入度。

N3 带权图使用 `vertices A B C`、`mode directed` 或 `mode undirected`、`start A`、`edge A B 权重`；最多 12 顶点、30 边，权重为 -999 至 999 的整数。Dijkstra 必须非负，按声明顺序处理相同距离；Prim/Kruskal 仅无向图，允许负权，等权按边输入顺序，不连通时输出最小生成森林；Prim 的 start 可选。并查集使用 `vertices A B` 后逐行 `union A B` / `find A B`，不做路径压缩。

回溯输入最多 6 个整数，输出不重复排列（空输入有一个空排列）；0/1 背包首行为 `capacity 0–20`，后续 `item 重量 价值`，最多 12 件、重量 1–20、价值 0–999；LCS 两行以 `text` 开头，每行最多 15 个 ASCII 字符，输出长度及一个最长公共子序列；KMP 使用 `text 文本` 和 `pattern 模式`，每项最多 30 个 ASCII 字符，模式不可空，返回所有起始位置，含重叠匹配。动态规划表按行列显示状态。

旧版通用 C 实验页面及后端保留为历史功能。`server.py` 仍包含源码执行 API，仅限受控的本地实验；经典入口请使用上述静态服务器，不要将旧服务直接公开到公网。

验证：`node tests/test_classic.cjs`、`node tests/test_classic_n2.cjs`、`node tests/test_classic_next.cjs`、`node tests/test_classic_structures.cjs`、`node tests/test_classic_final.cjs`、`node tests/test_classic_graph.cjs`、`node tests/test_classic_advanced.cjs`、`node tests/test_classic_advanced_ui.cjs`、`node tests/test_classic_extra.cjs`、`node tests/test_classic_range.cjs`、`node tests/test_classic_math.cjs`、`node tests/test_classic_graph2.cjs`、`node tests/test_classic_trees_dp.cjs`、`node tests/test_classic_misc.cjs`、`node tests/test_classic_flow.cjs`、`node tests/test_classic_strings.cjs`、`node tests/test_classic_ui.cjs`。

---
单调栈主题返回每个位置右侧第一个严格更大的值（不存在显示 ∅）；单调队列主题以 `size 窗口长度` 求各窗口最大值。快速选择第二行 `k 正整数`，按重复值占多个位置的规则返回第 K 大；空数组不可选择。计数排序接受 -20 至 20 的整数。上述数组最多 20 项。Trie 每行使用 `insert`、`search` 或 `prefix` 加 1–12 个小写字母，最多 50 条操作。哈夫曼输入最多 50 个可打印 ASCII 字符；按频率、节点编号决胜，单字符编码为 0，空文本编码为空。各主题展示自身状态和回放，不执行输入源码。

线段树和树状数组首行为初始数组（可空，最多 16 个整数，范围 -999 至 999），其后最多 40 行 `set 索引 值`；线段树用 `sum 左 右` 查询闭区间，树状数组用 `sum 索引` 查询包含该位置的前缀和。空数组无法查询或修改。AVL 输入最多 16 个整数，重复值不插入，节点卡片显示左右引用和高度。Bellman–Ford 与 Floyd–Warshall 使用 `vertices`、`mode directed/undirected`、`edge 起点 终点 权重`；Bellman–Ford 非空图须指定 `start`。最多 10 顶点、30 条边，权重 -99 至 99，重复边拒绝；∞ 表示不可达，−∞ 表示可经过负环、没有有限最短路。Bellman–Ford 只标记起点可达负环影响的顶点；Floyd–Warshall 标记可经过负环的顶点对。无向负权边构成可往返的负环。

基数排序接受最多 20 个 0–999 的非负整数，按十进制最低位稳定排序；桶排序接受最多 20 个 0–99 的整数，按十位分桶并在桶内排序；希尔排序接受最多 20 个 -999 至 999 的整数，间隔依次减半。三种排序均接受空数组与重复值。欧几里得最大公约数输入两个 -999999 至 999999 的整数，负数取绝对值，(0, 0) 约定为 0；埃拉托斯特尼素数筛输入 0–100 的整数上限，空输入和负数无效。

二分图判定与匹配、强连通分量、割点与桥沿用 `vertices A B`、`mode directed/undirected` 和逐行 `edge A B`；最多 12 顶点、30 条边，按顶点声明顺序访问邻居，重复边拒绝，无向反向边也视为重复。二分图及割点/桥只接受无向图，强连通分量只接受有向图；空图和非连通图均可输入，自环使图不是二分图。二分图按染色后增广求最大匹配，非二分图不执行匹配。0/1 迷宫首行 `grid`，后续为最多 10×10 的等长 0/1 行，0 可走、1 为墙；再写 `start 行 列`、`end 行 列`，索引从 0 开始，按上、右、下、左顺序 BFS。起终点不能是墙或越界，不可达显示无路径；空网格仅写 `grid`。

红黑树使用左倾红黑树插入与修复，B 树采用最小度数 t=2 的插入与分裂；两者输入最多 16 个 -999 至 999 的整数，空输入为空树，重复值不插入。最长递增子序列使用严格递增语义，最多 16 个整数，重复值不延长序列，空数组结果长度为 0。编辑距离接受两行 `text 字符串`，每项最多 15 个 ASCII 字符，可空，插入/删除/替换代价为 1。N 皇后输入 0–6 的整数，按行和列升序回溯，0 皇后有一个空方案，2 和 3 无方案。

扩展欧几里得输入两个 -999999 至 999999 的整数，输出非负 gcd 与满足原符号输入的贝祖系数，(0,0) 的 gcd 为 0。模快速幂输入 `底数 指数 模数`：底数 -999999 至 999999、指数 0–1000000、模数 1–1000000，以精确整数运算；0 的 0 次方按 1 取模。最近公共祖先首行以完整二叉树数组位置输入最多 31 个整数或 null/#，第二行 `query 索引 索引`；重复值按索引区分，空树或不存在节点不能查询。回文输入 `text 字符串`，最多 30 个可打印 ASCII 字符，可空，同长结果取最早发现者。匹配对比输入两行 `text 文本` 和 `pattern 模式`，每项最多 30 个可打印 ASCII 字符，文本可空、模式不可空；输出重叠匹配及各自匹配阶段字符比较次数，不含 KMP 前缀表构造。

网络流主题采用 Edmonds–Karp，输入 `vertices S A T`、`mode directed`、`source S`、`sink T` 与逐行 `edge 起点 终点 容量`；非空网络源汇须为不同的已声明顶点，空网络不指定源汇且最大流为 0，容量 0–99。拒绝自环与同向重复边，允许反向边；按顶点声明顺序搜索残量，展示增广、最大流和最小割。0–1 BFS 输入 `vertices`、`mode directed/undirected`、`start` 和逐行 `edge 起点 终点 权重`，权重仅 0 或 1，非空图须有起点；空图可不指定起点，不可达为 ∞。两主题均最多 10 顶点和 30 边；0–1 BFS 与 0 可走/1 墙的迷宫 BFS 不同。

Z 函数输入一行 `text 字符串`，支持最多 50 个可打印 ASCII 字符及空串，Z[0] 约定为 0。Rabin–Karp 输入 `text 文本` 和 `pattern 模式` 两行，各最多 50 个可打印 ASCII 字符，文本可空、模式不可空；使用基数 31、模数 101，哈希相等后核对原文，冲突不会误报，支持重叠匹配。Aho–Corasick 首行 `text 文本`（最多 50 个小写英文字母，可空），后续最多 8 行 `pattern 模式`（每个 1–10 个小写英文字母）；可不提供模式，重复模式按独立编号输出，结果索引从 0 开始。

</details>

## 本地静态发布准备

使用 Python 3 在尚不存在的目录中生成可复现的纯静态文件：

```powershell
python scripts/build_static.py --output artifacts/my-static-release
python scripts/build_static.py --verify artifacts/my-static-release
python -m http.server 8000 --bind 127.0.0.1 --directory artifacts/my-static-release
```

打开 http://127.0.0.1:8000。生成器只复制明确列出的 HTML、CSS 和 JavaScript，写入 SHA-256 清单，并拒绝覆盖已有目录；验证器拒绝额外文件、符号链接、清单不匹配、页面资源不匹配和直接网络调用。旧 `server.py`、`backend/`、旧页面与 C 执行 API 均不包含在产物中。使用静态文件服务；真实托管环境的配置、缓存和访问策略需在目标环境另行验证。

更新时使用新的空目录重新构建并校验，确认目标环境所服务的文件与清单一致；保留先前通过验证的完整目录及其清单作为回退版本。需要回退时将静态服务的根目录切换至该旧版本，并在目标环境复验页面和清单。上述步骤是本地准备，不代表已发布。

## 旧 C 实验

旧代码、服务与文件保留在工作树；历史用法和限制移至 [旧 C 实验说明](docs/LEGACY_C_EXPERIMENT.md)。旧服务包含源码执行 API，不属于静态产品，也不应作为公开服务直接运行。

完全背包首行 `capacity 0–20`，后续最多 12 行 `item 重量 价值`，重量 1–20、价值 0–999；物品种类可重复，每种均可无限次选取。状态 `dp[i][w]` 为前 i 种物品在容量 w 下的最大价值，选择当前物品时从同一行的 `dp[i][w-weight]` 转移；无物品或容量为 0 时结果为 0。硬币找零首行 `amount 0–50`，后续最多 12 行 `coin 面额`，面额 1–50，可重复且无限使用；状态记录凑出各金额的最少硬币数，不可达为 ∞，目标 0 为 0，无解明确提示。矩阵链乘法输入 2–9 个 1–50 的整数维度（最多 8 个矩阵），相邻维度构成矩阵；空输入表示空链，结果为 0，单矩阵也无需乘法。按区间和切分点求最少标量乘法次数，显示一种最优括号方案（并列取首次切分）。三个主题均拒绝负数及范围外输入。

本批回归：`node tests/test_classic_dp_batch.cjs`、`node tests/test_strings_observations.cjs` 和 `node tests/test_classic_advanced_ui.cjs`。

贪心主题中的活动选择和区间分组每行输入 `interval 开始 结束`，最多 12 个，端点为 -100–100 的整数且开始严格小于结束；空输入分别得到空选择和 0 个资源。区间采用半开 `[开始, 结束)`，结束与下一个开始相等时不冲突。活动选择按结束、开始、输入编号升序，每次选最早结束的可行活动；区间分组按开始、结束、输入编号升序，优先复用编号最小的空闲资源，否则新建资源。重复区间按输入编号作为不同活动处理。

分数背包首行为 `capacity 0–100`，后续最多 12 行 `item 重量 价值`，均为整数、重量 1–100、价值 0–999；零容量和无物品的总价值为 0。每个物品可以按重量连续分割，先按单位价值降序选择，相同单位价值按输入编号；比例使用整数交叉相乘比较，总价值显示精确分数（包括中间未约分分数），不以近似小数冒充精确值。无效输入拒绝，空物品列表可用。

贪心回归：`node tests/test_classic_greedy.cjs`、`node tests/test_classic_advanced_ui.cjs`。

C 语言与动态过程样板：冒泡排序和 Aho–Corasick 展示 C 代码，其余主题仍展示 JavaScript。冒泡比较高亮两个位置，交换时数字按实际交换步骤移动，绿色边框标示已排序区域；后退、时间轴和重置直接呈现对应快照，系统选择减少动态效果时不播放交换动画。AC 使用实线显示 Trie 转移、虚线显示已建立的失败链接，星号表示有输出的节点；下方列出输出编号与当前文本游标。页面执行受限输入的内置算法，展示代码不会在浏览器内运行。

教学样板目前覆盖冒泡排序和 Aho–Corasick：输入区前显示用途、输入输出及变量/图例；其余主题明确显示说明尚未编写。代码面板可展开为全宽，再次点击恢复；可切换折行与水平查看。AC 将转移和失败链接图例、当前文本游标、模式原文及起始位置分开显示，重复模式仍按编号区分。
AC 的阶段和队列显示当前事件的真实快照；模式对照从 0 开始编号，长匹配结果可在结果区内滚动。代码区会在步进时将活动行滚入可见范围，同时保留横向滚动位置。
数组插入/删除、栈和循环队列加入 C 代码与操作动画：数组逐次显示元素移动，栈顶和队列槽位显示进出，循环队列 `↻` 标识末槽与首槽相连。空操作与队满/队空行为见各主题提示；显示的 C 为说明片段，运行步骤由浏览器内固定实现生成。桌面宽窗口的“展开代码”保留侧边状态区，窄窗口上下排列。
单链表样板以 C 片段展示插入、删除及反转；实线箭头表示 next，虚线从 head 指向头节点，浅黄色节点标出 prev 或 curr。图形随实际步骤的引用快照更新；暂时脱链的节点继续显示，直到删除释放。该视图不依赖动态效果。
