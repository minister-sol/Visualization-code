# 首版 77 主题验收证据矩阵

冻结依据：[greedy-review 目录](../artifacts/greedy-review/snapshot/web/classic-catalog.js)，SHA-256 `6cc2b3810e2f522528352a6f0c03b357198a6fcdc82ba9f7ee260dec9da36223`。逐行的快照和报告是历史独立复核对象，不声称历史结果自动覆盖当前所有改动。2026-11-15 本次比较 greedy 快照 web 中 18 个文件与当前工作树逐字节一致；历史其他快照各自范围和后续变更以报告为准；[报告及历史清单指纹](V1_EVIDENCE_FINGERPRINTS.json)记录本次读取的来源。

当前集成：`tests/test_classic_v1_integration.cjs` 对 77 个默认示例共 1677 个步骤核对页面消息、计数与事件代码行高亮，逐主题检查提示、单步、重置、播放/暂停控件、非法输入清旧状态及恢复；此为模拟 DOM，单测不能证明每条算法语义或真实渲染。历史报告列出各主题独立参考、边界与关键行映射的具体样本，不代表全输入穷尽。

本执行环境尝试 Edge CDP 时 `connect EACCES 127.0.0.1:9333`，未进入真实页面断言；本次候选版本桌面、390px、键盘与逐主题浏览器回放未实测。下列浏览器列仅指历史报告或交接所记代表路径，具体版本、屏宽与覆盖以引用为准，不将一项报告推成 77 项全部通过。

| 主题（ID） | 历史受测快照 | 独立复核：边界及代码/事件证据 | 历史浏览器证据与缺口 |
|---|---|---|---|
| 数组 · 插入与删除 (`array`) | [n1n2-independent-review](../artifacts/n1n2-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1N2_INDEPENDENT.md) | N2 交接记录有 Edge 代表路径；本报告未运行 |
| 单链表 · 插入、删除与反转 (`linked`) | [n1n2-next-review](../artifacts/n1n2-next-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N2_NEXT_INDEPENDENT.md) | 报告未运行浏览器；另见执行计划 N2 记录 |
| 栈 · 入栈与出栈 (`stack`) | [n1-independent-review](../artifacts/n1-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1_INDEPENDENT.md) | N1 交接记录有 Edge 代表路径；本报告未运行 |
| 循环队列 (`queue`) | [n1n2-independent-review](../artifacts/n1n2-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1N2_INDEPENDENT.md) | N2 交接记录有 Edge 代表路径；本报告未运行 |
| 哈希表 · 链地址 (`hashChain`) | [n2-structs-review](../artifacts/n2-structs-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_STRUCTURES_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 哈希表 · 线性探测 (`hashLinear`) | [n2-structs-review](../artifacts/n2-structs-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_STRUCTURES_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 并查集 (`unionFind`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 单调栈 · 下一个更大元素 (`monoStack`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 单调队列 · 滑动窗口最大值 (`monoQueue`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| Trie 前缀树 (`trie`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉搜索树 (`bst`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉树 · 前序遍历 (`preorder`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉树 · 中序遍历 (`inorder`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉树 · 后序遍历 (`postorder`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉树 · 层序遍历 (`levelorder`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 二叉堆 · 插入与删除堆顶 (`heap`) | [n2-structs-review](../artifacts/n2-structs-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_STRUCTURES_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 堆排序 (`heapSort`) | [n2-structs-review](../artifacts/n2-structs-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_STRUCTURES_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 线段树 · 区间和与修改 (`segmentTree`) | [range-avl-graph-review](../artifacts/range-avl-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_RANGE_AVL_GRAPH_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 树状数组 · 前缀和与修改 (`fenwick`) | [range-avl-graph-review](../artifacts/range-avl-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_RANGE_AVL_GRAPH_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| AVL 树 · 插入与旋转 (`avl`) | [range-avl-graph-review](../artifacts/range-avl-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_RANGE_AVL_GRAPH_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 红黑树 · 插入修复 (`redBlack`) | [trees-dp-review](../artifacts/trees-dp-review/snapshot/) | [报告及所列边界、行映射](../artifacts/trees-dp-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| B 树 · 插入分裂 (`bTree`) | [trees-dp-review](../artifacts/trees-dp-review/snapshot/) | [报告及所列边界、行映射](../artifacts/trees-dp-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 二叉树最近公共祖先 (`lca`) | [misc-review](../artifacts/misc-review/snapshot/) | [报告及所列边界、行映射](../artifacts/misc-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 冒泡排序 (`bubble`) | [n1-independent-review](../artifacts/n1-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1_INDEPENDENT.md) | N1 交接记录有 Edge 代表路径；本报告未运行 |
| 选择排序 (`selection`) | [n1n2-independent-review](../artifacts/n1n2-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1N2_INDEPENDENT.md) | N2 交接记录有 Edge 代表路径；本报告未运行 |
| 插入排序 (`insertion`) | [n1n2-independent-review](../artifacts/n1n2-independent-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N1N2_INDEPENDENT.md) | N2 交接记录有 Edge 代表路径；本报告未运行 |
| 归并排序 (`merge`) | [n1n2-next-review](../artifacts/n1n2-next-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N2_NEXT_INDEPENDENT.md) | 报告未运行浏览器；另见执行计划 N2 记录 |
| 快速排序 (`quick`) | [n1n2-next-review](../artifacts/n1n2-next-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N2_NEXT_INDEPENDENT.md) | 报告未运行浏览器；另见执行计划 N2 记录 |
| 线性查找 (`linear`) | [n1n2-next-review](../artifacts/n1n2-next-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N2_NEXT_INDEPENDENT.md) | 报告未运行浏览器；另见执行计划 N2 记录 |
| 二分查找 (`binary`) | [n1n2-next-review](../artifacts/n1n2-next-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N2_NEXT_INDEPENDENT.md) | 报告未运行浏览器；另见执行计划 N2 记录 |
| 快速选择 · 第 K 大 (`quickSelect`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 计数排序 (`countSort`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 基数排序 (`radix`) | [math-topics-review](../artifacts/math-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_MATH_TOPICS_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 桶排序 (`bucket`) | [math-topics-review](../artifacts/math-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_MATH_TOPICS_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 希尔排序 (`shell`) | [math-topics-review](../artifacts/math-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_MATH_TOPICS_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 图 · 邻接表 (`graph`) | [n3-graph-review](../artifacts/n3-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_GRAPH_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 图 · 深度优先搜索 DFS (`graphDFS`) | [n3-graph-review](../artifacts/n3-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_GRAPH_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 图 · 广度优先搜索 BFS (`graphBFS`) | [n3-graph-review](../artifacts/n3-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_GRAPH_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 图 · 无权最短路径 (`graphShortest`) | [n3-graph-review](../artifacts/n3-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_GRAPH_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 图 · 拓扑排序 (`graphTopo`) | [n3-graph-review](../artifacts/n3-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_GRAPH_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| Dijkstra 最短路径 (`dijkstra`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| Prim 最小生成森林 (`prim`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| Kruskal 最小生成森林 (`kruskal`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| Bellman–Ford 负权最短路 (`bellmanFord`) | [range-avl-graph-review](../artifacts/range-avl-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_RANGE_AVL_GRAPH_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| Floyd–Warshall 全源最短路 (`floydWarshall`) | [range-avl-graph-review](../artifacts/range-avl-graph-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_RANGE_AVL_GRAPH_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 二分图判定与最大匹配 (`bipartite`) | [graph2-review](../artifacts/graph2-review/snapshot/) | [报告及所列边界、行映射](../artifacts/graph2-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 强连通分量 (`scc`) | [graph2-review](../artifacts/graph2-review/snapshot/) | [报告及所列边界、行映射](../artifacts/graph2-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 割点与桥 (`cutBridge`) | [graph2-review](../artifacts/graph2-review/snapshot/) | [报告及所列边界、行映射](../artifacts/graph2-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 0/1 迷宫最短路径 (`maze`) | [graph2-review](../artifacts/graph2-review/snapshot/) | [报告及所列边界、行映射](../artifacts/graph2-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 网络流 · 最大流与最小割 (`maxFlow`) | [flow-review](../artifacts/flow-review/snapshot/) | [报告及所列边界、行映射](../artifacts/flow-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 0–1 BFS 最短路径 (`zeroOneBFS`) | [flow-review](../artifacts/flow-review/snapshot/) | [报告及所列边界、行映射](../artifacts/flow-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 活动选择 · 最多互不冲突活动 (`activitySelection`) | [greedy-review](../artifacts/greedy-review/snapshot/) | [报告及所列边界、行映射](../artifacts/greedy-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 区间分组 · 最少资源 (`intervalGrouping`) | [greedy-review](../artifacts/greedy-review/snapshot/) | [报告及所列边界、行映射](../artifacts/greedy-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 分数背包 (`fractionalKnapsack`) | [greedy-review](../artifacts/greedy-review/snapshot/) | [报告及所列边界、行映射](../artifacts/greedy-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 双指针 · 两数之和 (`twoPointer`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 滑动窗口 · 最大定长窗口和 (`window`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 前缀和 · 区间求和 (`prefix`) | [n2-final-review](../artifacts/n2-final-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_FINAL_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 0/1 背包 (`knapsack`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 完全背包 (`completeKnapsack`) | [dp-batch-review](../artifacts/dp-batch-review/snapshot/) | [报告及所列边界、行映射](../artifacts/dp-batch-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 硬币找零 · 最少硬币数 (`coinChange`) | [dp-batch-review](../artifacts/dp-batch-review/snapshot/) | [报告及所列边界、行映射](../artifacts/dp-batch-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 矩阵链乘法 · 最少运算次数 (`matrixChain`) | [dp-batch-review](../artifacts/dp-batch-review/snapshot/) | [报告及所列边界、行映射](../artifacts/dp-batch-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 最长公共子序列 (`lcs`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 最长严格递增子序列 (`lis`) | [trees-dp-review](../artifacts/trees-dp-review/snapshot/) | [报告及所列边界、行映射](../artifacts/trees-dp-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 编辑距离 (`editDistance`) | [trees-dp-review](../artifacts/trees-dp-review/snapshot/) | [报告及所列边界、行映射](../artifacts/trees-dp-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 欧几里得最大公约数 (`gcd`) | [math-topics-review](../artifacts/math-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_MATH_TOPICS_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 埃拉托斯特尼素数筛 (`sieve`) | [math-topics-review](../artifacts/math-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_MATH_TOPICS_INDEPENDENT.md) | 原报告未跑；[Graph2 补测](../artifacts/graph2-review/independent-check/REVIEW.md)有 Edge 代表路径 |
| 扩展欧几里得算法 (`extGcd`) | [misc-review](../artifacts/misc-review/snapshot/) | [报告及所列边界、行映射](../artifacts/misc-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 模快速幂 (`fastPower`) | [misc-review](../artifacts/misc-review/snapshot/) | [报告及所列边界、行映射](../artifacts/misc-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 回溯 · 不同全排列 (`permutations`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| N 皇后回溯 (`queens`) | [trees-dp-review](../artifacts/trees-dp-review/snapshot/) | [报告及所列边界、行映射](../artifacts/trees-dp-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| KMP 字符串匹配 (`kmp`) | [n3-advanced-review](../artifacts/n3-advanced-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_N3_ADVANCED_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 哈夫曼编码 (`huffman`) | [extra-topics-review](../artifacts/extra-topics-review/snapshot/) | [报告及所列边界、行映射](../docs/VERIFY_EXTRA_TOPICS_INDEPENDENT.md) | 报告有 Edge 代表路径 |
| 回文串中心扩展 (`palindrome`) | [misc-review](../artifacts/misc-review/snapshot/) | [报告及所列边界、行映射](../artifacts/misc-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| 朴素匹配与 KMP 对比 (`stringCompare`) | [misc-review](../artifacts/misc-review/snapshot/) | [报告及所列边界、行映射](../artifacts/misc-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径 |
| Z 函数 (`zFunction`) | [strings-review](../artifacts/strings-review/snapshot/) | [报告及所列边界、行映射](../artifacts/strings-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径；AC/Z 修正另见 DP 复核 |
| Rabin–Karp 滚动哈希匹配 (`rabinKarp`) | [strings-review](../artifacts/strings-review/snapshot/) | [报告及所列边界、行映射](../artifacts/strings-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径；AC/Z 修正另见 DP 复核 |
| Aho–Corasick 多模式匹配 (`ahoCorasick`) | [strings-review](../artifacts/strings-review/snapshot/) | [报告及所列边界、行映射](../artifacts/strings-review/independent-check/REVIEW.md) | 报告有 Edge 代表路径；AC/Z 修正另见 DP 复核 |

其他未覆盖：Firefox/WebKit、Windows 以外系统、移动真机、IME、物理键盘专项、完整无障碍专项、长时性能及真实部署。候选需豆包独立复核；不得将矩阵写作首版整体验收通过。
