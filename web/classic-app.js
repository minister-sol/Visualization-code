if(globalThis.R1) R1.install(Classic);
const javaStepAlias={ahoCorasick:{s1:'init',s2:'operation',s3:'operation',s4:'advance',s5:'advance',s6:'advance',s7:'advance',s8:'advance',s9:'mark',s10:'result',s11:'result',s12:'result',s13:'result',s14:'result',s15:'result',s16:'result',s17:'result',s18:'result',s19:'result',s20:'scan',s21:'scan',s22:'scan',s23:'scan',s24:'scan',s25:'scan',s26:'scan',s27:'output',s28:'output',s29:'output'},graphBFS:{2:'init',4:'visit',5:'check',7:'check',11:'done',enqueue:'check'},zeroOneBFS:{check:'relax',enqueue:'relax'}};
if(globalThis.R1?.mapping) for(const [topic,alias] of Object.entries(javaStepAlias)){const map=R1.mapping[topic]?.java;if(!map)continue;for(const [step,tag] of Object.entries(alias))if(map[step]===undefined&&map[tag]!==undefined)map[step]=map[tag];}
const $ = id => document.getElementById(id);
let events = [], position = 0, timer = null;
let playbackEpoch=0,lastCodeSignature=null,fsOpen=false,fsSaved=null;
const topics = {
 bubble: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999；留空表示空数组。'],
 selection: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999；留空表示空数组。'],
 insertion: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999；留空表示空数组。'],
 stack: ['栈操作，每行一条','push 3\npush 1\npop\npush 2\npop','每行输入 push 整数 或 pop；最多 50 条，整数范围 -999 至 999。空行忽略。'],
 array: ['首行初始数组，其余为操作','1, 2, 3\ninsert 1 9\ndelete 0','首行整数以逗号或空白分隔，可留空；其后每行 insert 索引 整数 或 delete 索引。索引从 0 开始，最多 20 项、50 条操作。'],
 linked: ['首行初始链表，其余为操作','1, 2, 3\ninsert 1 9\ndelete 0\nreverse','首行整数可留空；后续每行 insert 索引 整数、delete 索引 或 reverse。索引从 0 开始，最多 20 节点和 50 条操作。'],
 linear: ['首行数组，第二行目标','3, 1, 3, 2\ntarget 3','首行为数组（可空），第二行 target 整数；返回第一个匹配索引，未找到返回 -1。'],
 binary: ['首行升序数组，第二行目标','1, 2, 2, 4\ntarget 2','首行为升序数组（可空），第二行 target 整数；返回第一个匹配索引。'],
 merge: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999。'],
 quick: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999。'],
 hashChain: ['容量与操作','capacity 4\ninsert 1\ninsert 5\nfind 5\ndelete 1','首行 capacity 容量（1–20），其后每行 insert、find 或 delete 整数；集合语义，重复值不插入。最多 49 条操作。'],
 hashLinear: ['容量与操作','capacity 4\ninsert 1\ninsert 5\ndelete 1\nfind 5','首行 capacity 容量（1–20），其后每行 insert、find 或 delete 整数；重复值不插入，删除后保留墓碑。最多 49 条操作。'],
 bst: ['二叉搜索树操作','insert 5\ninsert 3\ninsert 7\nfind 3\ndelete 5','每行 insert、find 或 delete 整数；集合语义，重复值不插入，最多 20 个节点、50 条操作。'],
 heap: ['大顶堆操作','insert 3\ninsert 8\ninsert 5\npop','每行 insert 整数 或 pop；允许重复值，最多 20 个元素、50 条操作。'],
 heapSort: ['排序数据','5, 2, 4, 2, 1','整数以逗号或空白分隔；最多 20 个，范围 -999 至 999。'],
 preorder: ['二叉树层序位置','1, 2, 3, 4, null, 5','按数组位置输入层序值，null 或 # 表示空节点；最多 31 个位置，父节点为空时子节点必须为空。'],
 inorder: ['二叉树层序位置','1, 2, 3, 4, null, 5','按数组位置输入层序值，null 或 # 表示空节点；最多 31 个位置，父节点为空时子节点必须为空。'],
 postorder: ['二叉树层序位置','1, 2, 3, 4, null, 5','按数组位置输入层序值，null 或 # 表示空节点；最多 31 个位置，父节点为空时子节点必须为空。'],
 levelorder: ['二叉树层序位置','1, 2, 3, 4, null, 5','按数组位置输入层序值，null 或 # 表示空节点；最多 31 个位置，父节点为空时子节点必须为空。'],
 twoPointer: ['首行升序数组，第二行目标','1, 2, 3, 4\ntarget 5','首行为升序数组（可空），第二行为 target 整数；寻找不同索引的一组两数之和。'],
 window: ['首行数组，第二行窗口长度','1, 3, 2, 5\nsize 2','首行整数数组，第二行 size 窗口长度；长度必须在 1 到数组长度之间，结果为最大定长窗口和。'],
 prefix: ['首行数组，第二行区间','1, 2, 3, 4\nrange 1 3','首行整数数组，第二行 range 左索引 右索引；区间两端均包含，从 0 开始。'],
 graph: ['图定义','vertices A B C D\nmode directed\nstart A\nedge A B\nedge A C\nedge B D','每行 vertices 顶点列表、mode directed/undirected、可选 start 顶点、edge 起点 终点；最多 12 顶点、30 条边。邻接点按顶点声明顺序访问。'],
 graphDFS: ['图定义','vertices A B C D\nmode directed\nstart A\nedge A B\nedge A C\nedge B D','非空图须指定 start；从起点探索可达部分。顶点最多 12 个、边最多 30 条，邻接点按顶点声明顺序访问。'],
 graphBFS: ['图定义','vertices A B C D\nmode undirected\nstart A\nedge A B\nedge A C\nedge B D','非空图须指定 start；从起点探索可达部分。顶点最多 12 个、边最多 30 条，邻接点按顶点声明顺序访问。'],
 graphShortest: ['图定义','vertices A B C D\nmode directed\nstart A\nedge A B\nedge A C\nedge B D','无权图最短路径；非空图须指定 start，未到达顶点距离为空。邻接点按顶点声明顺序访问。'],
 graphTopo: ['图定义','vertices A B C D\nmode directed\nedge A B\nedge A C\nedge B D','仅有向图；按声明顺序初始化零入度队列，按邻接顺序追加。若有向环存在则不能完成拓扑排序。'],
 dijkstra: ['带权图','vertices A B C D\nmode directed\nstart A\nedge A B 2\nedge A C 5\nedge B C 1\nedge C D 3','vertices、mode directed/undirected、start 起点、edge 起点 终点 非负整数权重；最多 12 顶点、30 边。'],
 prim: ['带权无向图','vertices A B C D\nmode undirected\nstart A\nedge A B 2\nedge A C 5\nedge B C 1\nedge C D 3','无向带权图；可负权，不连通时输出最小生成森林；start 可选，等权按边输入顺序。'],
 kruskal: ['带权无向图','vertices A B C D\nmode undirected\nedge A B 2\nedge A C 5\nedge B C 1\nedge C D 3','无向带权图；可负权，不连通时输出最小生成森林；等权按边输入顺序。'],
 unionFind: ['集合与操作','vertices A B C\nunion A B\nfind A C\nunion B C\nfind A C','首行 vertices，后续 union A B 或 find A B，最多 12 顶点和 50 条操作。'],
 permutations: ['排列数据','1, 2, 2','最多 6 个整数；重复值产生不重复排列，空输入得到一个空排列。'],
 activitySelection: ['活动区间','interval 1 3\ninterval 2 5\ninterval 3 4\ninterval 4 6','每行 interval 开始 结束，最多 12 个，端点为 -100–100 整数且开始小于结束；空输入允许。半开区间端点相接不冲突；按结束、开始、输入编号排序。'],
 intervalGrouping: ['活动区间','interval 1 4\ninterval 2 5\ninterval 4 6','每行 interval 开始 结束，最多 12 个，端点为 -100–100 整数且开始小于结束；空输入需 0 个资源。半开区间相接可复用；按开始、结束、输入编号排序，优先复用编号最小的空闲资源。'],
 fractionalKnapsack: ['容量与物品','capacity 5\nitem 3 4\nitem 4 7\nitem 2 3','首行 capacity 0–100；后续最多 12 行 item 重量 价值，重量 1–100、价值 0–999，均为整数。物品可分割，按单位价值降序，比例相同按输入顺序；价值用精确分数表示。'],
 completeKnapsack: ['容量与物品','capacity 7\nitem 2 3\nitem 3 4','首行 capacity 0–20；后续最多 12 行 item 重量 价值，重量 1–20、价值 0–999。同一物品可无限次使用；无物品或容量为 0 时最大价值为 0。'],
 coinChange: ['目标金额与硬币面额','amount 6\ncoin 1\ncoin 3\ncoin 4','首行 amount 0–50，后续最多 12 行 coin 面额（1–50）；面额可重复且无限使用，求最少枚数。目标 0 需要 0 枚；无法凑出时显示无解。'],
 matrixChain: ['矩阵维度数组','10, 20, 30, 40','输入 2–9 个 1–50 的整数表示相邻矩阵的维度；留空表示空矩阵链。求最少标量乘法次数及一种最优括号方案。'],
 knapsack: ['容量与物品','capacity 5\nitem 2 3\nitem 3 4\nitem 4 5','首行 capacity 0–20，后续 item 重量 价值；重量 1–20，价值 0–999，最多 12 件。'],
 lcs: ['两个字符串','text ABCBDAB\ntext BDCABA','两行 text 字符串；每行最多 15 个 ASCII 字符，可空，计算 LCS 长度并回溯一个序列。'],
 kmp: ['文本与模式','text ABABABA\npattern ABA','两行 text 文本及 pattern 模式；最多 30 个 ASCII 字符，模式不可空，返回所有匹配（含重叠）。'],
 monoStack: ['数组','2, 1, 2, 4, 3','最多 20 个整数，范围 -999 至 999；求每个位置右侧第一个严格更大值，空数组允许。'],
 monoQueue: ['首行数组，第二行窗口长度','1, 3, -1, -3, 5, 3, 6, 7\nsize 3','最多 20 个整数；size 须在 1 与数组长度之间，输出每个定长窗口的最大值。'],
 quickSelect: ['首行数组，第二行 k','3, 2, 1, 5, 6, 4\nk 2','最多 20 个整数；k 从 1 开始，重复值按位置计数，空数组不可选择。'],
 countSort: ['数组','2, -1, 2, 0','最多 20 个整数，范围 -20 至 20；输出升序结果，允许空数组及重复值。'],
 trie: ['前缀树操作','insert cat\ninsert car\nsearch cat\nprefix ca','每行 insert、search 或 prefix 加 1–12 个小写英文字母，最多 50 条操作；空输入为空树。'],
 huffman: ['待编码文本','aaabbc','最多 50 个可打印 ASCII 字符，不含换行；频率相同按节点编号决定，单字符使用 0。'],
 segmentTree: ['初始数组与操作','1, 2, 3, 4\nsum 0 2\nset 1 5\nsum 1 3','首行最多 16 个整数，可空；后续 set 索引 值 或 sum 左 右，闭区间；空数组不能操作，最多 40 条。'],
 fenwick: ['初始数组与操作','1, 2, 3, 4\nsum 2\nset 1 5\nsum 3','首行最多 16 个整数，可空；后续 set 索引 值 或 sum 索引（含该位置的前缀和），空数组不能操作，最多 40 条。'],
 avl: ['插入序列','3, 1, 2, 5, 4','输入最多 16 个整数，范围 -999 至 999；空输入为空树，重复值不插入，显示旋转与高度。'],
 bellmanFord: ['带权图','vertices A B C D\nmode directed\nstart A\nedge A B 2\nedge B C -4\nedge A C 4','最多 10 顶点、30 边、权重 -99 至 99；有向或无向，非空图须 start；不可达为 ∞，可达负环影响为 −∞。'],
 floydWarshall: ['带权图','vertices A B C D\nmode directed\nedge A B 2\nedge B C -4\nedge A C 4','最多 10 顶点、30 边、权重 -99 至 99；有向或无向；∞ 不可达，经过负环的顶点对为 −∞。'],
 radix: ['排序数据','170, 45, 75, 90, 802, 24, 2, 66','最多 20 个 0–999 的非负整数；允许空数组与重复值，按十进制最低位稳定排序。'],
 bucket: ['排序数据','42, 5, 33, 91, 20, 42','最多 20 个 0–99 的整数；允许空数组与重复值，按十位分 10 个桶，桶内升序。'],
 shell: ['排序数据','8, -3, 5, 1, 5','最多 20 个 -999 至 999 的整数；允许空数组及重复值，间隔依次减半。'],
 gcd: ['两个整数','48 18','输入两个 -999999 至 999999 的整数；负数取绝对值，0 与 0 的结果约定为 0。'],
 sieve: ['范围上限','30','输入 0–100 的整数 n，筛出不大于 n 的素数；空输入或负数无效。'],
 bipartite: ['无向图','vertices A B C D\nmode undirected\nedge A C\nedge A D\nedge B C','无向简单图，最多 12 顶点、30 边；按顶点声明顺序染色和尝试增广，非二分图不匹配，允许空图。'],
 scc: ['有向图','vertices A B C D\nmode directed\nedge A B\nedge B A\nedge B C\nedge C D','有向图，最多 12 顶点、30 边；两遍 DFS 均按声明顺序访问邻居，允许空图、自环和非连通图。'],
 cutBridge: ['无向图','vertices A B C D\nmode undirected\nedge A B\nedge B C\nedge C A\nedge C D','无向简单图，最多 12 顶点、30 边；按声明顺序访问邻居，允许空图、自环和非连通图。'],
 maze: ['迷宫定义','grid\n000\n110\n000\nstart 0 0\nend 2 2','grid 后为等长 0/1 行（0 可走、1 是墙），最多 10×10；再写 start 行 列 与 end 行 列，按上右下左搜索。空网格仅写 grid。'],
 redBlack: ['插入序列','7, 3, 9, 1, 5, 4','输入最多 16 个 -999 至 999 的整数；空输入为空树，重复值不插入；使用左倾红黑树修复。'],
 bTree: ['插入序列','1, 2, 3, 4, 5, 6','输入最多 16 个 -999 至 999 的整数；空输入为空树，重复值不插入；最小度数 t=2。'],
 lis: ['数组','3, 1, 2, 5, 4','输入最多 16 个 -999 至 999 的整数；严格递增，相等值不延长序列；空数组长度为 0。'],
 editDistance: ['两个字符串','text kitten\ntext sitting','两行 text 字符串，每行最多 15 个 ASCII 字符；可为空，插入、删除和替换代价均为 1。'],
 queens: ['棋盘大小','4','输入 0–6 的整数 n；按行回溯、列从小到大，n=0 有一个空方案，n=2 或 3 无方案。'],
 extGcd: ['两个整数','30 18','两个 -999999 至 999999 的整数；负数保留原符号的贝祖系数，(0,0) 的 gcd 为 0。'],
 fastPower: ['底数 指数 模数','2 10 1000','底数 -999999 至 999999，指数 0–1000000，模数 1–1000000；精确整数模幂，0 的 0 次方按 1 取模。'],
 lca: ['首行树，第二行查询','1, 2, 3, 4, 5\nquery 3 4','首行按完整二叉树数组索引输入，null/# 表示空；最多 31 个位置，第二行 query 索引 索引；空树和不存在节点不能查询，重复值按索引区分。'],
 palindrome: ['字符串','text babad','输入 text 加最多 30 个可打印 ASCII 字符；text 单独一行表示空串，同长度结果保留最早发现者。'],
 stringCompare: ['文本和模式','text ABABABA\npattern ABA','两行 text 文本和 pattern 模式，各最多 30 个可打印 ASCII 字符；文本可空、模式不可空，返回重叠匹配并比较匹配阶段次数（不含前缀表构造）。'],
 maxFlow: ['有向容量网络','vertices S A B T\nmode directed\nsource S\nsink T\nedge S A 3\nedge S B 2\nedge A B 1\nedge A T 2\nedge B T 3','最多 10 顶点、30 条有向边，容量 0–99；非空网络须指定不同的 source、sink；拒绝自环和同向重复边。按顶点声明顺序 BFS，支持反向有向边。'],
 zeroOneBFS: ['0/1 权图','vertices A B C D\nmode directed\nstart A\nedge A B 1\nedge A C 0\nedge C B 0\nedge B D 1','最多 10 顶点、30 条边；权重仅 0 或 1，非空图须指定 start；有向/无向均可，邻接按顶点声明顺序。∞ 表示不可达。'],
 zFunction: ['字符串','text aabcaabxaaaz','一行 text 加最多 50 个可打印 ASCII 字符，允许空字符串；Z[0] 约定为 0。'],
 rabinKarp: ['文本与模式','text ababa\npattern aba','两行 text 文本和 pattern 模式，各最多 50 个可打印 ASCII 字符；文本可空、模式不可空，哈希相等后核对原文。'],
 ahoCorasick: ['文本与模式','text ushers\npattern he\npattern she\npattern hers','首行 text 后接最多 8 行 pattern；文本最多 50 个小写字母且可空，每个模式为 1–10 个小写字母。重复模式按独立编号输出。'],
 queue: ['队列容量和操作','capacity 3\nenqueue 1\nenqueue 2\ndequeue\nenqueue 3\nenqueue 4','首个非空行为 capacity 容量（1–20），其后每行 enqueue 整数 或 dequeue；最多 49 条操作。空行忽略。']
};
const structureTeaching={
 preorder:{purpose:'前序按根 → 左 → 右访问每个节点，适用于层次结构复制、目录或表达式树的前缀表示。递归需要 O(h) 调用栈，时间 O(n)。',io:'按数组层序位置输入最多31项，左右孩子位置为2i+1和2i+2；null/#为空，空输入为空树，重复值保留。输出访问值序列。',symbols:'C 中 Node 保存 value/left/right，root 是根，node 是当前调用参数，visit 是递归函数，printf 追加输出。#编号区分重复值；L/R为父子引用，虚线琥珀边为当前递归路径，亮色节点为当前调用；空节点调用时无亮色节点。路径从root到栈顶，返回步骤仍显示待退出调用，下一步弹栈；序列只在printf行增长。'},
 inorder:{purpose:'中序按左 → 根 → 右访问每个节点，适用于二叉搜索树的有序枚举；普通二叉树不保证排序。递归需要 O(h) 调用栈，时间 O(n)。',io:'按数组层序位置输入最多31项，左右孩子位置为2i+1和2i+2；null/#为空，空输入为空树，重复值保留。输出访问值序列。',symbols:'C 中 Node 保存 value/left/right，root 是根，node 是当前调用参数，visit 是递归函数，printf 追加输出。#编号区分重复值；L/R为父子引用，虚线琥珀边为当前递归路径，亮色节点为当前调用；空节点调用时无亮色节点。路径从root到栈顶，返回步骤仍显示待退出调用，下一步弹栈；序列只在printf行增长。'},
 bst:{purpose:'二叉搜索树用于动态有序集合和查找；左子树小于节点、右子树大于节点，未平衡时可能退化为链。',io:'每行 insert/find/delete 整数，重复值保持原树；最多 20 节点、50 操作。查找返回是否存在。',symbols:'Node 含 value、left、right；root 为根，node 为当前递归节点，successor 为右子树最小节点。编号代表身份，复制后继值不改变编号。L/R 连线表示真实左右引用，亮色为当前节点；每步切换快照，删除返回后由父节点或 root 接回子树。C 需 stdlib.h 与 Node 结构定义；内存不足时退出。'},
 linked:{purpose:'单链表通过 next 指针连接节点，适合频繁调整局部连接；按索引查找需从头遍历。',io:'首行最多 20 个整数，可空；后续 insert 索引 值、delete 索引或 reverse，索引从 0 开始。',symbols:'head 是首节点，next 是后继，prev 与 curr 为当前指针；实线表示真实 next，虚线表示头指针，脱链节点仍在回放中可见。'},
 array:{purpose:'数组按连续位置存储，适合按索引访问；中间插入和删除需要移动后续元素。',io:'首行最多 20 个整数，可空；后续 insert 索引 值或 delete 索引，索引从 0 开始。',symbols:'a 为存储区，n 为长度，ops 为操作；高亮位置和移动方向表示当前搬移，移动期间显示工作槽位。'},
 stack:{purpose:'栈后进先出，常用于撤销、表达式求值和函数调用。',io:'最多 50 行 push 整数或 pop；空栈 pop 不改变状态。',symbols:'stack 是数组，size 是元素数；最右端为栈顶。'},
 queue:{purpose:'循环队列先进先出，用于调度与缓冲，复用已释放的槽位。',io:'capacity 1–20 后逐行 enqueue 整数或 dequeue；队满入队、队空出队不改变状态。',symbols:'slots 是物理槽位，head 是队头，size 是长度；↻ 表示末槽接回首槽，队尾按模容量回绕；空槽由 head 和 size 判断，0 也可作为有效值。'}
};
const teachingTopics={
 heap:{purpose:'大顶堆用于优先队列，根始终为最大值；查任意元素不适合。插入删除O(log n)。',io:'insert 整数或 pop，最多20对象；输出最终堆数组，非排序序列。',symbols:'heap_size是节点数，i当前下标，parent=(i-1)/2非负整除；根无父节点。图上方数组与下方树的同编号是同一对象。'},
 activitySelection:{purpose:'单资源最多安排互不冲突活动。按结束时间贪心选择，排序O(n²)用于最多12个活动；不解决带权最大价值。',io:'interval 开始 结束；半开区间，端点相接兼容；输出输入编号，从0开始。',symbols:'last_end是上次所选结束时间；上区为已选，下区候选或冲突。横坐标是真实时间，条宽为持续时间。'},
 bubble:{purpose:'将整数按升序排列；适合学习比较与交换，小数据量时容易理解。',io:'输入最多 20 个 -999 至 999 的整数，可空；输出升序数组。',symbols:'a 是数组，n 是长度，end 是本轮末尾，j 是比较位置；比较结果会影响是否交换。'},
 ahoCorasick:{purpose:'在一段文本中同时查找多个模式，适合关键词过滤与多词检索。',io:'输入最多 50 个小写字母的文本及最多 8 个模式，每个模式 1–10 个小写字母；输出模式及起始索引，允许重叠和重复模式。',symbols:'state 是当前节点，fail 是失败链接，queue 保存待处理节点；patterns 是模式数组，np 是模式数，matches 记录结果，Match 是结果类型，used 是已创建节点数。'}
};
for (const [name, example] of Object.entries(globalThis.CLibrary?.examples || {})) {
  const labels = {text:'文本',capacity:'缓冲区容量',count:'元素数或循环次数',a:'第一个值',b:'第二个值',key:'查找目标',mode:'打开模式',offset:'偏移量',first:'第一个整数',second:'第二个整数',third:'第三个整数',exponent:'指数',seed:'随机种子',shift:'相对秒数',start:'开始时间',end:'结束时间',scenario:'扩容模式（success 或 failure）',base:'进制（10 或 16）',year:'年份',month:'月份',day:'日期'};
  topics[name] = ['调用参数', example.args.map(arg => arg[1]).join('\n'),
    '按顺序输入 ' + example.args.map(([key]) => labels[key] || key).join('、') + (example.args.length > 1 ? '，每行一个参数。' : '。') +
    (name === 'strlen' ? '按 UTF-8 字节计数。' : '本例使用 ASCII 字符。')];
  Classic.code[name] = example.source;
  Classic[name] = input => CLibrary.steps(name,input);
}
function showTeaching(){const box=$('teaching');if(!box)return;
  const name = $('topic').value;
  const example = globalThis.CLibrary?.examples[name];
  if ($('stateTitle')) $('stateTitle').textContent = example ? '标准用法与注意事项' : '当前状态';
  if ($('wsVisual')) $('wsVisual').textContent = example ? '只看用法' : '只看图示';
  for (const id of ['codeLang','fsLang']) {
    const control = $(id);
    if (control?.parentElement) control.parentElement.hidden = Boolean(example);
  }
  if (example) {
    const list = document.createElement('dl');
    list.className = 'library-guide';
    const add = (label, value) => {
      const row = document.createElement('div');
      const heading = document.createElement('dt');
      const detail = document.createElement('dd');
      heading.textContent = label;
      detail.textContent = value;
      row.append(heading, detail);
      list.append(row);
    };
    add('这个样板怎么用', example.note);
    add('头文件和标准原型', '<' + example.header + '> · ' + CLibrary.prototypes[name]);
    box.replaceChildren(list);
    return;
  }
  const rt=globalThis.SortSearchTeaching?.[$('topic').value]||globalThis.TraversalPreparation?.teaching[$('topic').value]||globalThis.R3Preparation?.teaching[$('topic').value]||globalThis.R1?.teaching?.[$('topic').value];const t=rt?{purpose:rt.purpose,io:rt.io,symbols:rt.legend}:teachingTopics[$('topic').value]||structureTeaching[$('topic').value];box.textContent=t?`用途：${t.purpose} 输入与输出：${t.io} 变量与符号：${t.symbols}`:'该主题的教学说明尚未编写；可先参考输入提示和逐步状态。';}
function clearTimer(){ if (timer !== null) { clearInterval(timer); globalThis.clearTimeout?.(timer); } timer = null; }
function stop() { playbackEpoch++; globalThis.R1?.cancel(); for(const animation of ($('state').getAnimations?.({subtree:true}) || [])) animation.finish(); clearTimer(); $('play').textContent = '▶ 播放'; }
/* 暂停保留在途动画：停住当前画面，不取消也不快进到终点。 */
function pauseMotion() { let n = 0; for (const animation of ($('state').getAnimations?.({ subtree: true }) || [])) { const st = animation.playState; if (st === 'running' || st === 'pending') { try { animation.pause(); n++; } catch (e) { } } } return n; }
/* 继续播放：从被暂停的时间点恢复，不重绘、不重置进度。 */
function resumeMotion() { let n = 0; for (const animation of ($('state').getAnimations?.({ subtree: true }) || [])) { if (animation.playState === 'paused') { try { animation.play(); n++; } catch (e) { } } } return n; }
function hasPausedMotion() { return [...($('state').getAnimations?.({ subtree: true }) || [])].some(a => a.playState === 'paused'); }
/* 等到在途动画结束再推进，避免下一帧取消动画造成跳变；最长等待 900ms。 */
function waitMotion() { const anims = [...($('state').getAnimations?.({ subtree: true }) || [])]; if (!anims.length) return Promise.resolve(); return Promise.race([Promise.allSettled(anims.map(a => a.finished)), new Promise(resolve => setTimeout(resolve, 900))]); }
function schedule(){
  const speed=Number($('speed').value);
  globalThis.R1?.setFrameBudget?.(speed);
  if(events[position]?.teachingTopic){
    const epoch=playbackEpoch;
    /* 一帧的总预算就是档位值：动画先占用，剩余时间才停留；因此开始间隔≈档位，动画不会叠加等待。 */
    const advance=async()=>{ if(timer===null||epoch!==playbackEpoch)return; await waitMotion(); if(timer===null||epoch!==playbackEpoch)return; const started=performance.now(); if(position<events.length-1){position++;await render(true);} if(timer===null||epoch!==playbackEpoch)return; if(position===events.length-1){stop();return;} const reading=Math.max(0,(events[position]?.message||'').length*40); const target=speed>=1000?Math.min(4200,Math.max(speed,500+reading)):speed; const dwell=Math.max(0,target-(performance.now()-started)); timer=setTimeout(advance,dwell); };
    timer=setTimeout(advance,speed);
  }else{
    const epoch=playbackEpoch;
    timer=setInterval(()=>{ if(timer===null||epoch!==playbackEpoch)return; if(position<events.length-1){position++;render(true);} if(position===events.length-1)stop(); },speed);
  }
}
function toggleTheme() { const dark=document.body.dataset.theme==='dark'; document.body.dataset.theme=dark?'light':'dark'; $('themeToggle').textContent=dark?'切换深色主题':'切换浅色主题'; $('themeToggle').setAttribute('aria-pressed',String(!dark)); }
function drawGraph(event) {
  const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
  const attr=(el,attrs)=>{for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));};
  attr(svg,{viewBox:'0 0 320 280',width:320,height:280,class:'graph-svg',style:'width:320px;max-width:none;height:auto',role:'img','aria-label':`图：${event.graph.directed?'有向':'无向'}，顶点 ${event.graph.vertices.join('、')}`});
  const add=(tag,attrs,parent=svg)=>{const e=document.createElementNS(ns,tag);attr(e,attrs);parent.append(e);return e;};
  const defs=add('defs',{}),marker=add('marker',{id:'graph-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);add('path',{d:'M 0 0 L 10 5 L 0 10 z',class:'graph-arrow'},marker);
  const n=event.graph.vertices.length, coords=Object.fromEntries(event.graph.vertices.map((v,i)=>{const a=2*Math.PI*i/Math.max(n,1)-Math.PI/2;return [v,[160+100*Math.cos(a),140+95*Math.sin(a)]];}));
  for(const [u,v,weight] of event.graph.edges){const [x1,y1]=coords[u],[x2,y2]=coords[v];let d;if(u===v)d=`M ${x1-10} ${y1-17} C ${x1-38} ${y1-65}, ${x1+38} ${y1-65}, ${x1+10} ${y1-17}`;else{const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;const reciprocal=event.graph.directed&&event.graph.edges.some(e=>e[0]===v&&e[1]===u);const bend=reciprocal?22:0;d=`M ${x1+ux*20} ${y1+uy*20} Q ${(x1+x2)/2-uy*bend} ${(y1+y2)/2+ux*bend} ${x2-ux*24} ${y2-uy*24}`;}const chosen=event.chosen?.some(e=>(e[0]===u&&e[1]===v)||(e[0]===v&&e[1]===u));add('path',{d,class:'graph-edge'+(chosen?' chosen':''),...(event.graph.directed?{'marker-end':'url(#graph-arrow)'}:{})});if(weight!==undefined){const w=add('text',{x:u===v?x1:(x1+x2)/2,y:u===v?y1-50:(y1+y2)/2-5,class:'weight-label'});w.textContent=weight;}}
  for(const v of event.graph.vertices){const [x,y]=coords[v];add('circle',{cx:x,cy:y,r:19,class:'graph-node'+(event.seen.includes(v)?' visited':'')+(event.graph.focus===v?' focused':'')});const label=add('text',{x,y:y+5,'text-anchor':'middle',class:'graph-label'});label.textContent=v;}
  return svg;
}
function drawAC(event, label = 'Trie 实线为转移，虚线为失败链接') {
 const nodes=event.nodesSnapshot, ns='http://www.w3.org/2000/svg', wrap=document.createElement('div'), svg=document.createElementNS(ns,'svg'); wrap.className='ac-wrap'; const add=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));svg.append(e);return e;};
 const pos=[],depth=[];let leaf=0;function place(id,d){depth[id]=d;const children=Object.values(nodes[id].next);if(!children.length)pos[id]=leaf++*70+40;else{children.forEach(c=>place(c,d+1));pos[id]=(pos[children[0]]+pos[children.at(-1)])/2;}}place(0,0);const width=Math.max(120,leaf*70+10),height=(Math.max(...depth)+1)*85+20;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('style','max-width:100%;height:auto');svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
 nodes.forEach((node,i)=>{for(const [ch,j] of Object.entries(node.next)){const x=pos[i],y=depth[i]*85+35,X=pos[j],Y=depth[j]*85+35;add('line',{x1:x,y1:y,x2:X,y2:Y,class:'ac-edge'});const t=add('text',{x:(x+X)/2,y:(y+Y)/2-3,class:'ac-edge-label'});t.textContent=ch;}if(i&&node.failReady){add('line',{x1:pos[i]+8,y1:depth[i]*85+35,x2:pos[node.fail]+8,y2:depth[node.fail]*85+35,class:'ac-fail'});}});
 nodes.forEach((node,i)=>{add('circle',{cx:pos[i],cy:depth[i]*85+35,r:19,class:'graph-node'+(event.indices.includes(i)?' focused':'')});const t=add('text',{x:pos[i],y:depth[i]*85+40,'text-anchor':'middle',class:'graph-label'});t.textContent='#'+i+(node.out.length?'*':'');});wrap.append(svg);return wrap;
}
function drawBST(event){
 const ns='http://www.w3.org/2000/svg',nodes=new Map(event.tree.map(n=>[n.id,n])),pos=new Map();let rank=0,maxDepth=0;
 function layout(id,depth){if(id===null)return;const n=nodes.get(id);layout(n.left,depth+1);pos.set(id,[64+rank++*104,64+depth*104]);maxDepth=Math.max(maxDepth,depth);layout(n.right,depth+1);}layout(event.root,0);
 const bstW=Math.max(330,rank*104+48),bstH=maxDepth*104+130;
 const shell=document.createElement('div');shell.className='tree-shell';
 const toolbar=document.createElement('div');toolbar.className='tree-toolbar';
 const zoomNote=document.createElement('span');zoomNote.className='tree-zoom-note';
 const viewport=document.createElement('div');viewport.className='tree-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','树图，可手动滚动；切换节点时跟随焦点');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${bstW} ${bstH}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','二叉树根、左右子树与递归路径');
 viewport.append(svg);shell.append(toolbar,viewport);shell.viewport=viewport;shell.treeBBox={width:bstW,height:bstH};
 const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el;};
 for(const n of event.tree){const [x,y]=pos.get(n.id);for(const side of ['left','right'])if(n[side]!==null){const [tx,ty]=pos.get(n[side]);add('line',{x1:x,y1:y+27,x2:tx,y2:ty-27,class:(event.path?.includes(n.id)&&event.path?.includes(n[side]))?'linked-head':'linked-edge'});add('text',{x:(x+tx)/2,y:(y+ty)/2,class:'ac-edge-label'},side==='left'?'L':'R');}}
 for(const n of event.tree){const [x,y]=pos.get(n.id);add('circle',{cx:x,cy:y,r:28,class:'graph-node'+(event.focus===n.id?' focused':'')});add('text',{x,y:y-2,'text-anchor':'middle','font-size':17,'font-weight':700,class:'graph-label'},n.value);add('text',{x,y:y+16,'text-anchor':'middle','font-size':13,class:'linked-identity'},'节点 '+n.id);if(n.id===event.root)add('text',{x,y:y-38,'text-anchor':'middle','class':'ac-edge-label'},'root');}
 const host=document.querySelector('#state');const avail=Math.max(280,(host?.clientWidth||420)-20);const fit=Math.min(2.4,Math.max(1,avail/bstW));let zoom=fit;
 function apply(){svg.setAttribute('width',String(Math.round(bstW*zoom)));svg.setAttribute('height',String(Math.round(bstH*zoom)));svg.setAttribute('style',`width:${Math.round(bstW*zoom)}px;height:${Math.round(bstH*zoom)}px;display:block`);shell.treeFocus=pos.get(event.focus??(position===0?event.root:null));shell.treeFocus=shell.treeFocus?[shell.treeFocus[0]*zoom,shell.treeFocus[1]*zoom]:null;zoomNote.textContent=`缩放 ${Math.round(zoom*100)}% · 节点 ${rank} 个`;}
 const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);toolbar.append(b);return b;};
 button('放大',()=>{zoom=Math.min(3.2,zoom*1.25);apply();});
 button('缩小',()=>{zoom=Math.max(0.6,zoom/1.25);apply();});
 button('全树',()=>{zoom=fit;apply();viewport.scrollTo(0,0);});
 button('回到焦点',()=>{zoom=Math.max(fit,1.2);apply();ensureTreeVisible(viewport);});
 toolbar.append(zoomNote);apply();return shell;
}
function ensureTreeVisible(wrap){
 if(!wrap?.treePoint||!wrap.clientWidth||!wrap.clientHeight)return;
 const [x,y]=wrap.treePoint,pad=36;
 if(x-pad<wrap.scrollLeft)wrap.scrollLeft=Math.max(0,x-pad);else if(x+pad>wrap.scrollLeft+wrap.clientWidth)wrap.scrollLeft=x+pad-wrap.clientWidth;
 if(y-pad<wrap.scrollTop)wrap.scrollTop=Math.max(0,y-pad);else if(y+pad>wrap.scrollTop+wrap.clientHeight)wrap.scrollTop=y+pad-wrap.clientHeight;
}
globalThis.addEventListener?.('resize',()=>ensureTreeVisible($('state').children?.[0]));
function drawLinked(event){const ns='http://www.w3.org/2000/svg',wrap=document.createElement('div'),svg=document.createElementNS(ns,'svg'),nodes=event.nodes,gap=nodes.length>8?96:112,cardW=88,cardH=54,top=118,coords=new Map(nodes.map((n,i)=>[n.id,64+i*gap])),linkW=Math.max(360,(nodes.length-1)*gap+cardW+96),linkH=272;wrap.className='ac-wrap';const add=(tag,attrs,text)=>{const x=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,String(v));if(text!==undefined)x.textContent=text;svg.append(x);return x;};svg.setAttribute('viewBox',`0 0 ${linkW} ${linkH}`);svg.setAttribute('width',linkW);svg.setAttribute('height',linkH);svg.setAttribute('style','display:block;max-width:none;height:auto');svg.setAttribute('role','img');svg.setAttribute('aria-label','单链表节点、next 连接与 head、prev、curr 指针');const defs=document.createElementNS(ns,'defs');for(const [id,fill] of [['linked-arrow','#526b82'],['linked-arrow-back','#a56100']]){const arrow=document.createElementNS(ns,'marker'),tip=document.createElementNS(ns,'path');arrow.setAttribute('id',id);arrow.setAttribute('viewBox','0 0 10 10');arrow.setAttribute('refX','9');arrow.setAttribute('refY','5');arrow.setAttribute('markerWidth','7');arrow.setAttribute('markerHeight','7');arrow.setAttribute('orient','auto');tip.setAttribute('d','M 0 0 L 10 5 L 0 10 z');tip.setAttribute('fill',fill);arrow.append(tip);defs.append(arrow);}svg.append(defs);
/* 顶部三条独立泳道：head/prev/curr 标签固定，先用文字写明目标节点，再用彩色引线指向节点顶部，避免压在卡片或 next 箭头上。 */
const lanes=[['head',event.head,'#a56100',true,'linked-head'],['prev',event.prev,'#1f6b46',false,'linked-prev'],['curr',event.curr,'#12559c',false,'linked-curr']];lanes.forEach(([name,target,color,dashed,cls],lane)=>{const y=20+lane*28;const label=add('text',{x:12,y,'class':'linked-pointer-label '+cls},`${name} → ${target===null?'∅':'节点 '+target}`);const w=Math.max(64,String(name).length*9+18);if(target!==null&&coords.has(target)){const x=coords.get(target),sx=12+w,ey=top-7;add('path',{d:`M ${sx} ${y-4} L ${Math.max(sx,x-10)} ${y-4} Q ${x} ${y-4} ${x} ${y+8} L ${x} ${ey}`,class:'linked-pointer'+(dashed?' linked-pointer-dashed':''),stroke:color,'marker-end':`url(#${dashed?'linked-arrow':'linked-arrow-back'})`});}});
for(const n of nodes){const x=coords.get(n.id),y=top+cardH/2;if(n.next!==null&&coords.has(n.next)){const target=coords.get(n.next),back=target<x,curveY=back?linkH-20:top+cardH+38;add('path',{d:`M ${x+cardW/2} ${y} Q ${(x+target)/2} ${curveY} ${target-cardW/2} ${y}`,class:'linked-edge'+(back?' linked-edge-back':''),'marker-end':back?'url(#linked-arrow-back)':'url(#linked-arrow)'});add('text',{x:(x+target)/2,y:curveY+(back?-8:16),'text-anchor':'middle',class:'ac-edge-label linked-next-label'},'next');}else if(n.next===null){add('text',{x:x+cardW/2+12,y:y+5,class:'ac-edge-label'},'∅');}add('rect',{x:x-cardW/2,y:top,width:cardW,height:cardH,rx:7,class:'graph-node'+(event.prev===n.id?' linked-prev-node':'')+(event.curr===n.id?' linked-curr-node':'')+(event.prev===n.id||event.curr===n.id?' focused':'')});add('text',{x,y:top+26,'text-anchor':'middle','font-size':17,'font-weight':700,class:'graph-label'},String(n.value));add('text',{x,y:top+43,'text-anchor':'middle','font-size':13,class:'linked-identity'},'节点 '+n.id);}wrap.append(svg);return wrap;}
function ensureCodeVisible() {
 const code=$('code'), row=code.children?.[events[position]?.line-1];
 if(!row || !Number.isFinite(row.offsetTop) || !code.clientHeight)return;
 const top=row.offsetTop, bottom=top+row.offsetHeight, visibleBottom=code.scrollTop+code.clientHeight-24;
 if(top<code.scrollTop)code.scrollTop=top;else if(bottom>visibleBottom)code.scrollTop=Math.max(0,bottom-code.clientHeight+24);
}
function codeRowClass(event,i){return 'line'+((event.line===i+1||(event.lineEnd&&i+1>=event.line&&i+1<=event.lineEnd))?' active':'');}
function buildCodeRows(lines,event){const tokenized=(event.teachingTopic||event.library)&&globalThis.R1?.tokenizeSource?R1.tokenizeSource(lines):null;return lines.map((line,i)=>{const row=document.createElement('div');row.className=codeRowClass(event,i);const n=document.createElement('span');n.textContent=String(i+1).padStart(2,' ');const content=document.createElement('code');if(tokenized){for(const token of tokenized[i]){const span=document.createElement('span');if(token.cls)span.className=token.cls;span.textContent=token.text;content.append(span);}}else content.textContent=line;row.append(n,content);return row;});}
const traversalLegend='图例：方块上行数字是节点值，下行“节点 id”是层序输入位置（从1计），用来区分重复值；“下标 i”是数组槽位位置；L/R 是父子引用；高亮节点是当前 node。';
const arrayLegend='图例：卡片上行大字是值，下行“元素 id”是对象身份（交换后不变）；卡片下方虚线框写“下标 i”，是数组位置；粗边或高亮为当前比较/搬移目标。';
const treeLegend='图例：节点上行是值，下行“节点 id”是按创建顺序的身份；L/R 是左右子引用；“下标 i”是数组或槽位位置；高亮为当前节点。';
const stringLegend='图例：[i] 是字符下标（从0计）；上行为文本、下行为模式，模式按当前窗口对齐；绿色为当前窗口或比较字符。';
const groupingLegend='图例：活动编号 id 是输入编号；R0、R1… 是资源泳道；条形宽度按真实区间时长换算；短条放不下的文字移到条外，用引线或编号对应。';
const selectionLegend='图例：活动编号 id 是输入编号；[start,end) 是半开区间；条形宽度照真实时长，短条标签移到条形外；绿色为已选。';
const graphLegend='图例：字母是顶点标签；边旁数字是权重；虚线是候选边或失败链接；高亮为当前访问顶点。';
const tableLegend='图例：表格首行/首列以外的数字是状态值；行列下标 i、j 对应输入数组位置；深色框为当前单元格。';
const defaultLegend='图例：“元素 id”或“节点 id”是对象身份，卡片下方“下标 i”是数组位置；卡片内大字是数值。';
const identityNouns={stack:'对象',trie:'字符节点',preorder:'树节点',inorder:'树节点',postorder:'树节点',levelorder:'树节点',avl:'树节点',redBlack:'树节点',bTree:'B 树节点',lca:'树节点',scc:'分量',activitySelection:'活动',intervalGrouping:'活动',fractionalKnapsack:'物品',huffman:'字符节点',ahoCorasick:'AC 节点'};
function semanticizeText(text,topic){const noun=identityNouns[topic];if(!noun)return text;let out=String(text)
  .replace(/(?:树|B 树|Trie|AC |Huffman )?节点编号\s*#(\d+)/g,`${noun} $1`)
  .replace(/(?:树|B 树|Trie|AC |Huffman )?节点\s*#(\d+)/g,`${noun} $1`)
  .replace(/(对象|活动|物品|区间)\s*#(\d+)/g,`${noun} $1`)
  .replace(/([A-Za-z][A-Za-z0-9]*)\s*#(\d+)/g,`$1 ${noun} $2`)
  .replace(/#无/g,'无').replace(/#∅/g,'∅')
  .replace(/#(\d+)/g,`${noun} $1`);
if(topic==='scc')out=out.replace(/(\d)([A-Za-z])/g,'$1 $2');
return out;}
function semanticizeDisplay(topic){const roots=['message','state','stateHint','stateLegend','varList','acPhase'].map(id=>$(id)).filter(Boolean);for(const root of roots){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const next=semanticizeText(node.nodeValue,topic);if(next!==node.nodeValue)node.nodeValue=next;}}}
function stateLegendFor(topic){if(['preorder','inorder','postorder','levelorder'].includes(topic))return traversalLegend;if(topic==='activitySelection')return selectionLegend;if(topic==='intervalGrouping')return groupingLegend;if(['kmp','rabinKarp','zFunction','stringCompare','palindrome'].includes(topic))return stringLegend;if(['bst','trie','avl','redBlack','bTree','huffman','segmentTree','fenwick','lca','trees'].includes(topic))return treeLegend;if(['array','heap','heapSort','bubble','selection','insertion','merge','quick','radix','bucket','shell','countSort','quickSelect','linear','binary','twoPointer','window','prefix','monoStack','monoQueue'].includes(topic))return arrayLegend;if(['graph','graphDFS','graphBFS','graphShortest','graphTopo','dijkstra','prim','kruskal','bellmanFord','floydWarshall','bipartite','scc','cutBridge','maxFlow','zeroOneBFS','unionFind'].includes(topic))return graphLegend;if(['knapsack','completeKnapsack','coinChange','matrixChain','lcs','lis','editDistance'].includes(topic))return tableLegend;return defaultLegend;}

function parseDescribeText(text){const rows=[];for(const raw of String(text||'').split('；')){const seg=raw.trim();if(!seg)continue;const lead=/^图中(.+)$/.exec(seg);if(lead&&rows.length){rows[rows.length-1].graphic=lead[1];continue;}const item=/^([^=：]+?)\s*=\s*(.+?)：(.+)$/.exec(seg);if(item)rows.push({name:item[1],value:item[2],meaning:item[3],graphic:''});else if(rows.length&&!rows[rows.length-1].graphic)rows[rows.length-1].graphic=seg;}return rows;}
function variableRows(event){let rows=[];try{rows=R1.describeItems?R1.describeItems(event):[];}catch(e){rows=[];}if(!(Array.isArray(rows)&&rows.length)){try{rows=R1.variableItems?R1.variableItems(event):[];}catch(e){rows=[];}}if(Array.isArray(rows)&&rows.length)return rows;try{return parseDescribeText(R1.describe?R1.describe(event):'');}catch(e){return [];}}
function renderVariableList(event){const box=$('varList'),hint=$('stateHint'),rows=variableRows(event);if(!box){if(hint)hint.hidden=false;return;}if(!rows.length){box.hidden=true;box.replaceChildren();if(hint)hint.hidden=false;return;}const nodes=rows.map(item=>{const row=document.createElement('div');row.className='var-row';const name=document.createElement('div');name.className='var-name';name.textContent=`${item.name} = ${item.value}`;const meaning=document.createElement('div');meaning.className='var-meaning';meaning.textContent=item.meaning||'';const graphic=document.createElement('div');graphic.className='var-graphic';graphic.textContent=`图中${item.graphic||''}`;row.append(name,meaning,graphic);return row;});box.replaceChildren(...nodes);box.hidden=false;if(hint)hint.hidden=true;}
function render(animate=false) {
  globalThis.R1?.setFrameBudget?.(Number($('speed').value));
  globalThis.R1?.beforeRender?.();
  const event=events[position]; if(!event)return;
  if(event.teachingTopic&&globalThis.R1?.language==='java'&&!globalThis.R1.programs?.[event.teachingTopic]?.java){
    globalThis.R1.language='c';
    if($('codeLang'))$('codeLang').value='c99';
    if($('fsLang'))$('fsLang').value='c99';
  }
  const stdin=$('programInput');if(stdin&&!event.teachingTopic)stdin.textContent='该主题尚无完整程序标准输入。';
  if(event.teachingTopic){const map=R1.mapping[event.teachingTopic][R1.language];const key=event.step!==undefined?event.step:event.line;if(key!==undefined&&map&&map[key]!==undefined)event.line=map[key];else if(event.step!==undefined)event.line=null;event.lineEnd=R1.rangeEnd?.(event)??(event.step==='sort'?R1.mapping[event.teachingTopic][R1.language].sort_end:event.line);Classic.code[event.teachingTopic]=R1.source(event.teachingTopic);}
  const oldTree=$('state').children?.[0],oldVp=oldTree?.classList?.contains('tree-viewport')?oldTree:oldTree?.querySelector?.('.tree-viewport'),oldScroll=oldVp?{left:oldVp.scrollLeft||0,top:oldVp.scrollTop||0,focus:oldTree.treeFocus}:null;
  const language=document.querySelector?.('#codeLanguage'); if(language) language.textContent=['bubble','ahoCorasick','array','stack','queue','linked','bst','preorder','inorder'].includes($('topic').value)?'C · 只读':'JavaScript · 只读';
  $('state').className=['bubble','array','stack','queue'].includes($('topic').value)?'state bubble-state':'state';
  const selector=$('codeLang');if(selector)selector.disabled=!event.teachingTopic;
  const signature=event.library || (event.teachingTopic?$('topic').value+R1.language:null);
  if(!signature||signature!==lastCodeSignature) $('code').replaceChildren(...buildCodeRows(Classic.code[$('topic').value],event));
  lastCodeSignature=signature;
  if(signature)Array.from($('code').children).forEach((row,i)=>row.className=codeRowClass(event,i));
  if(fsOpen){const st=$('fsCode').scrollTop;renderFsCode();$('fsCode').scrollTop=st;}
  ensureCodeVisible();
  $('state').replaceChildren(...event.state.map((value,i)=>{const cell=document.createElement('div');cell.className='cell'+(event.indices.includes(i)?' selected':'')+(event.sortedFrom!==undefined&&i>=event.sortedFrom?' bubble-sorted':'')+(animate&&event.swap&&event.swap[0]===i?' swap-from-right':'')+(animate&&event.swap&&event.swap[1]===i?' swap-from-left':'')+(animate&&event.move&&event.move.to===i?(event.move.from<i?' move-right':' move-left'):'')+(animate&&['push','enqueue','insert'].includes(event.motion)&&event.indices.includes(i)?' motion-enter':'');const v=document.createElement('strong');v.textContent=value===null?'∅':value;const label=document.createElement('small');label.textContent=event.heapView?`${i} · 父 ${i?Math.floor((i-1)/2):'∅'} · 左 ${2*i+1<event.heapSize?2*i+1:'∅'} · 右 ${2*i+2<event.heapSize?2*i+2:'∅'}${i>=event.heapSize?' · 已排序':''}`:$('topic').value==='stack'&&i===event.state.length-1?`${i} · 栈顶`:$('topic').value==='queue'?`${i}${i===event.head?' · 队头':''}${i===(event.head+event.size)%event.capacity?' · 队尾':''}${i===event.capacity-1?' ↻':''}`:i;cell.append(v,label);if(animate&&event.motion==='dequeue'&&event.indices.includes(i)){const ghost=document.createElement('strong');ghost.className='queue-exit';ghost.textContent=event.removed;cell.append(ghost);}return cell;}));
  if(animate&&event.motion==='pop'&&event.removed!==undefined){const ghost=document.createElement('div');ghost.className='cell motion-exit';ghost.textContent=event.removed;$('state').append(ghost);}
  if(event.graph) $('state').replaceChildren(drawGraph(event));
  if($('topic').value==='ahoCorasick'&&event.nodesSnapshot) $('state').replaceChildren(drawAC(event));
  if(event.maze){const grid=document.createElement('div');grid.className='maze-grid';grid.setAttribute('style',`grid-template-columns:repeat(${event.maze.columns},minmax(36px,1fr))`);event.state.forEach((value,i)=>{const cell=document.createElement('div');const r=Math.floor(i/event.maze.columns),c=i%event.maze.columns;cell.className='maze-cell'+(event.maze.grid[r][c]==='1'?' wall':'')+(event.indices.includes(i)?' selected':'')+(event.path?.some(p=>p[0]===r&&p[1]===c)?' path':'');cell.textContent=value;grid.append(cell);});$('state').replaceChildren(grid);}

  if(event.table){const wrap=document.createElement('div');wrap.className='dp-wrap';const table=document.createElement('table');table.className='dp-table';event.table.forEach((row,i)=>{const tr=document.createElement('tr');row.forEach((value,j)=>{const td=document.createElement('td');td.textContent=value===Infinity?'∞':value===-Infinity?'−∞':value;if(i===event.row&&j===event.column)td.className='active';tr.append(td);});table.append(tr);});wrap.append(table);if(event.graph)$('state').append(wrap);else $('state').replaceChildren(wrap);}
  if(event.nodes) $('state').replaceChildren(drawLinked(event));
  if(event.tree && ['bst','preorder','inorder'].includes($('topic').value)) {const wrap=drawBST(event),vp=wrap.viewport||wrap;$('state').replaceChildren(wrap);if(oldScroll){vp.scrollLeft=oldScroll.left;vp.scrollTop=oldScroll.top;}if(position===0||!oldScroll||oldScroll.focus!==event.focus)ensureTreeVisible(vp);}
  else if(event.tree){ $('state').replaceChildren(...event.tree.map(node=>{const cell=document.createElement('div');cell.className='cell'+(node.id===event.focus?' selected':'');const v=document.createElement('strong');v.textContent=node.value;const label=document.createElement('small');label.textContent=`#${node.id} · 左 ${node.left===null?'∅':'#'+node.left} · 右 ${node.right===null?'∅':'#'+node.right}${node.height!==undefined?' · 高 '+node.height:''}${node.color!==undefined?' · '+node.color:''}`;cell.append(v,label);return cell;})); }
  if(!(event.graph ? event.graph.vertices.length : event.tree ? event.tree.length : event.nodes ? event.nodes.length : event.table ? event.table.length : event.state.length)){const empty=document.createElement('span');empty.className='empty';empty.textContent='空';$('state').append(empty);}
  $('message').textContent=(event.line===null?'[说明步骤，无代码行] ':'')+event.message; $('count').textContent=`${position+1} / ${events.length}`;
  var varBox=$('varList');if(varBox){varBox.hidden=true;varBox.replaceChildren();}var hintBox=$('stateHint');if(hintBox)hintBox.hidden=false;
  {const legendBox=$('stateLegend');if(legendBox){const text=stateLegendFor($('topic').value);if(legendBox.textContent!==text)legendBox.textContent=text;legendBox.hidden=!text;}}
  $('stateHint').textContent=$('topic').value==='stack'?'从左到右为栈底到栈顶。':$('topic').value==='queue'?`物理槽位（循环相连）；队头 ${event.head}，下一个队尾 ${(event.head+event.size)%event.capacity}，长度 ${event.size} / ${event.capacity}。∅ 为空槽。`:$('topic').value==='insertion'&&event.key!==null?`当前待插入值 key = ${event.key}；右移期间数组可能暂时包含重复值。`:'下方数字为数组索引；高亮标出当前关注的元素。';
  if(event.nodes) $('stateHint').textContent=`节点按创建顺序排列；head → ${event.head===null?'∅':'节点 '+event.head}，prev → ${event.prev===null?'∅':event.prev===0?'虚拟头':'节点 '+event.prev}，curr → ${event.curr===null?'∅':'节点 '+event.curr}。顶部泳道标签写明指针目标，next 箭头显示真实引用。`;
  if(event.target!==undefined) $('stateHint').textContent=`目标 ${event.target}；结果 ${event.result===null?'尚未确定':event.result}${event.left!==undefined?`；区间 [${event.left}, ${event.right})`:''}。`;
  if(event.segment) $('stateHint').textContent=`归并区间 [${event.segment.join(', ')})；暂存 [${event.temp.join(', ')}]。`;
  if(event.range) $('stateHint').textContent=`快速排序区间 [${event.range.join(', ')}]；基准 ${event.pivot===null?'尚未选择':event.pivot}。`;
  if(event.tree) $('stateHint').textContent=`根节点 ${event.root===null?'∅':'#'+event.root}；L 为左子引用，R 为右子引用；BST 显示父子连线。${event.result===null?'':event.result?'查找结果：找到。':'查找结果：未找到。'}`;
  if(event.heapView) $('stateHint').textContent=`数组索引 i 的父节点为 ⌊(i−1)/2⌋，左右孩子为 2i+1 和 2i+2；当前堆长度 ${event.heapSize}。`;
  if($('topic').value==='hashChain') $('stateHint').textContent='每个单元是一个桶，箭头连接同桶元素；高亮桶表示当前比较位置。';
  if($('topic').value==='hashLinear') $('stateHint').textContent='∅ 为空槽，deleted 是可重用墓碑；高亮为当前探测槽位。';
  if(event.output) $('stateHint').textContent=`访问序列 [${event.output.join(', ')}]${$('topic').value==='levelorder'?`；队列节点 [${event.queue.map(x=>'#'+x).join(', ')}]`:''}。`;
  if(event.kind==='twoPointer') $('stateHint').textContent=`左右指针 ${event.left}、${event.right}；目标 ${event.target}；结果 ${event.result?'['+event.result.join(', ')+']':event.line===8?'未找到':'尚未确定'}。`;
  if(event.kind==='window') $('stateHint').textContent=`当前范围 [${event.left}, ${event.right}]，和 ${event.sum}；最大完整窗口和 ${event.best===null?'尚未确定':event.best}。`;
  if(event.kind==='prefix') $('stateHint').textContent=`前缀和 [${event.prefix.join(', ')}]；查询 [${event.left}, ${event.right}]；结果 ${event.result===null?'尚未确定':event.result}。`;
  if(event.path) $('stateHint').textContent+=` 递归路径 [${event.path.map(id=>'#'+id).join(' → ')}]；当前 ${event.focus===null?'NULL / 无':('#'+event.focus)}；阶段 ${event.phase??'初始'}。`;
  if(event.graph){const adj=event.graph.vertices.map(v=>`${v}: ${event.adjacency[v].join(', ')||'∅'}`).join('；');let details=`${event.graph.directed?'有向':'无向'}图；邻接表 ${adj||'空'}。已访问 [${event.seen.join(', ')}]；顺序 [${(event.order||[]).join(', ')}]。`;if(event.graphMode==='graphDFS')details+=` 递归栈 [${event.stack.join(', ')}]。`;if(['graphBFS','graphShortest','graphTopo'].includes(event.graphMode))details+=` 队列 [${event.queue.join(', ')}]。`;if(event.graphMode==='graphShortest')details+=` 距离与路径：${event.graph.vertices.map(v=>`${v}=${event.distance[v]===null?'不可达':event.distance[v]} (${event.paths[v]?event.paths[v].join(' → '):'尚无路径'})`).join('；')}。`;if(event.graphMode==='graphTopo')details+=` 入度：${event.graph.vertices.map(v=>`${v}=${event.indegree[v]}`).join('；')}。${event.cycle?' 检测到有向环。':''}`;$('stateHint').textContent=details;}
  if(event.sortedFrom!==undefined) $('stateHint').textContent=event.sortedFrom>=event.state.length?'暂无已排序区域。':`索引 ${event.sortedFrom} 及之后为已排序区域。`;
  if(event.details) $('stateHint').textContent=event.details;
  const isAC=$('topic').value==='ahoCorasick', legend=$('acLegend'), cursorBox=$('acCursor'), matchBox=$('acMatches');
  if(legend&&cursorBox&&matchBox){legend.hidden=cursorBox.hidden=matchBox.hidden=!isAC;const phaseBox=$('acPhase'), patternsBox=$('acPatterns');if(phaseBox&&patternsBox){phaseBox.hidden=patternsBox.hidden=!isAC;if(isAC){phaseBox.textContent=`阶段：${event.phase}；队列：[${event.queueSnapshot.map(x=>'#'+x).join(', ') || '空'}]`;patternsBox.textContent='模式对照：'+(event.patternsSnapshot.map((p,i)=>`${i}: ${p}`).join('；')||'无');}}if(isAC){legend.textContent='图例：实线表示字符转移；虚线表示已建立的失败链接；* 表示节点有输出。';cursorBox.replaceChildren();cursorBox.append('文本：');for(let i=0;i<event.text.length;i++){const span=document.createElement('span');span.textContent=event.text[i];span.className=i===event.cursor?'ac-cursor':'';cursorBox.append(span);}if(!event.text.length)cursorBox.append('∅');matchBox.textContent='匹配：'+(event.matches.map(m=>`${event.patternsSnapshot[m.pattern]}（模式 ${m.pattern}）@${m.start}`).join('；')||'暂无');$('stateHint').textContent='节点输出：'+(event.nodesSnapshot.map((n,i)=>n.out.length?`#${i}=[${n.out.join(',')}]`:null).filter(Boolean).join('；')||'无');}else if($('topic').value==='bubble'){legend.hidden=false;legend.textContent='图例：黄色标出正在比较的元素；绿色边框表示已排序区域。';}}

  $('timeline').max=events.length-1; $('timeline').value=position; $('timeline').disabled=false; $('play').disabled=false; $('reset').disabled=false;
  $('prev').disabled=position===0; $('next').disabled=position===events.length-1;
  if(event.teachingTopic){$('state').className='state r1-state';globalThis.R1?.setAnimate?.(animate);const promise=R1.draw(event,$('state'),animate);const stdin=$('programInput');if(stdin)stdin.textContent=R1.inputData(event.teachingTopic,$('input').value);$('stateHint').textContent=R1.describe(event);renderVariableList(event);if(language)language.textContent=({c:'C99 · 完整程序',cpp:'C++17 · 兼容程序',java:'Java · 完整程序'})[R1.language]||'C99 · 完整程序';semanticizeDisplay($('topic').value);return promise;}

  if (event.library) {
    const example = CLibrary.examples[event.library];
    language.textContent = 'C99 · 完整程序';
    $('programInput').textContent = (example.stdin ? '标准输入 ' : '命令行参数（按顺序） ') + JSON.stringify(example.args.length === 1 ? [$('input').value] : $('input').value.split('\n'));
    const guide = CLibrary.guide[event.library];
    const list = document.createElement('dl');
    list.className = 'library-guide';
    for (const [field, label] of Object.entries({
      parameters: '每个参数填什么', requires: '调用前先确认', returns: '怎样读返回值',
      effects: '调用后发生什么', examples: '用几个输入理解它', warning: '最容易踩的坑'
    })) {
      if (!guide[field]) continue;
      const row = document.createElement('div');
      const heading = document.createElement('dt');
      const detail = document.createElement('dd');
      heading.textContent = label;
      if (field === 'warning') {
        const highlight = document.createElement('mark');
        highlight.textContent = guide[field];
        detail.append(highlight);
      } else {
        detail.textContent = guide[field];
      }
      row.append(heading, detail);
      list.append(row);
    }
    $('state').replaceChildren(list);
    $('stateHint').textContent = '';
    $('stateLegend').hidden = true;
    return;
  }
  semanticizeDisplay($('topic').value);
}
function invalidate(){if(fsOpen)closeCodeFullscreen();lastCodeSignature=null; for(const id of ['acLegend','acCursor','acMatches','acPhase','acPatterns']){const el=$(id);if(el){el.hidden=true;el.replaceChildren();el.textContent='';}} events=[];position=0;$('code').replaceChildren();$('state').replaceChildren();$('message').textContent='未生成有效步骤。';$('stateHint').textContent='';$('count').textContent='0 / 0';$('timeline').max=0;$('timeline').value=0;for(const id of ['prev','next','play','reset','timeline'])$(id).disabled=true; }
function run() {stop();globalThis.R1?.reset();try{events=Classic[$('topic').value]($('input').value);position=0;$('error').textContent='';render();}catch(e){invalidate();$('error').textContent=e.message;if(typeof $('input').focus==='function')$('input').focus();}}
function choose() {stop();showTeaching();const [label,value,hint]=topics[$('topic').value];$('inputLabel').textContent=label;$('input').value=value;$('hint').textContent=hint;run();}
function filterTopics() {
  const current = $('topic').value;
  const matches = ClassicCatalog.search($('topicSearch').value);
  const isLibrary = id => Boolean(globalThis.CLibrary?.examples[id]);
  const option = (id, label) => {
    const node = document.createElement('option');
    node.value = id;
    node.textContent = label;
    return node;
  };
  const ids = new Set(matches.map(item => item.id));
  const algorithms = [];
  if (isLibrary(current)) {
    // The playback controller still reads the active topic from its original select.
    const active = option(current, '选择算法或数据结构');
    active.hidden = true;
    algorithms.push(active);
  } else if (!ids.has(current)) {
    algorithms.push(option(current, ClassicCatalog.entries.find(item => item.id === current)?.label || current));
  }
  for (const [category, items] of ClassicCatalog.groups) {
    const group = document.createElement('optgroup');
    group.label = category;
    for (const [id, label] of items) {
      if (ids.has(id) && !isLibrary(id)) group.append(option(id, label));
    }
    if (group.children.length) algorithms.push(group);
  }
  $('topic').replaceChildren(...algorithms);
  $('topic').value = current;
  const library = $('libraryTopic');
  if (library) {
    const options = matches.filter(item => isLibrary(item.id)).map(item => option(item.id, item.label));
    if (isLibrary(current) && !ids.has(current)) {
      options.unshift(option(current, ClassicCatalog.entries.find(item => item.id === current).label));
    }
    library.replaceChildren(option('', '选择标准库函数'), ...options);
    library.value = isLibrary(current) ? current : '';
  }
  if (isLibrary(current)) $('topic').setAttribute('aria-label', '选择算法或数据结构');
  else $('topic').removeAttribute('aria-label');
  $('searchCount').textContent = matches.length ? '找到 ' + matches.length + ' 个主题。' : '没有匹配主题，当前主题保持不变。';
}
$('libraryTopic')?.addEventListener('change', () => {
  const selected = $('libraryTopic').value;
  if (!selected) { filterTopics(); return; }
  const topic = $('topic');
  const active = document.createElement('option');
  active.value = selected;
  active.hidden = true;
  topic.append(active);
  topic.value = selected;
  topic.dispatchEvent(new Event('change'));
});
$('codeExpand')?.addEventListener('click',()=>{const panels=$('panels'),button=$('codeExpand'),on=panels.classList.toggle('code-expanded');button.setAttribute('aria-pressed',String(on));button.textContent=on?'恢复布局':'展开代码';ensureCodeVisible();});
$('codeWrap')?.addEventListener('click',()=>{const code=$('code'),button=$('codeWrap'),on=code.classList.toggle('wrap-code');button.setAttribute('aria-pressed',String(on));button.textContent=on?'水平查看':'代码折行';ensureCodeVisible();});
$('topicSearch').addEventListener('input',filterTopics);
$('example').addEventListener('click',()=>{choose();if(typeof $('input').focus==='function')$('input').focus();});
$('input').addEventListener('input',()=>{if(events.length){stop();invalidate();$('message').textContent='输入已更改，请重新生成步骤。';$('error').textContent='';}});
$('topic').addEventListener('change',()=>{choose();filterTopics();});$('run').addEventListener('click',run);
$('reset').addEventListener('click',()=>{stop();position=0;render();});
$('prev').addEventListener('click',()=>{stop();position=Math.max(0,position-1);render();});
$('next').addEventListener('click',()=>{stop();position=Math.min(events.length-1,position+1);render(true);});
$('timeline').addEventListener('input',()=>{stop();position=Number($('timeline').value);render();});
$('play').addEventListener('click',()=>{if(timer!==null){playbackEpoch++;clearTimer();pauseMotion();$('play').textContent='▶ 播放';return;}const resumed=hasPausedMotion()?resumeMotion():0;if(position===events.length-1)position=0;if(!resumed)render();$('play').textContent='❚❚ 暂停';schedule();});
$('speed').addEventListener('change',()=>{if(timer===null)return;playbackEpoch++;clearTimer();schedule();});choose();filterTopics();$('themeToggle').addEventListener('click',toggleTheme);

const languageSelect=$('codeLang');if(languageSelect)languageSelect.addEventListener('change',()=>{stop();R1.language=(languageSelect.value==='c99'?'c':languageSelect.value);render();});globalThis.addEventListener?.('resize',()=>{if(events[position]?.teachingTopic){stop();render();}});

function currentCodeLines(){return Classic.code[$('topic').value]||[];}
function renderFsCode(){const fs=$('fsCode');if(!fs)return;const event=events[position]||{teachingTopic:false};fs.replaceChildren(...buildCodeRows(currentCodeLines(),event));}
function openCodeFullscreen(){stop();fsSaved={scrollTop:$('code').scrollTop,active:document.activeElement};const fsLang=$('fsLang');if(fsLang)fsLang.value=R1.language==='c'?'c99':R1.language;renderFsCode();$('fsOverlay').hidden=false;document.body.classList.add('fs-open');const wrap=$('fsCode');wrap.scrollTop=fsSaved.scrollTop;wrap.focus();fsOpen=true;}
function closeCodeFullscreen(){$('fsOverlay').hidden=true;document.body.classList.remove('fs-open');fsOpen=false;const saved=fsSaved;fsSaved=null;if(saved?.active&&typeof saved.active.focus==='function')saved.active.focus();}
async function copyFsSource(){const text=currentCodeLines().join('\n');try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();}}
$('codeFullscreen')?.addEventListener('click',openCodeFullscreen);
$('fsExit')?.addEventListener('click',closeCodeFullscreen);
$('fsWrap')?.addEventListener('click',()=>{const fs=$('fsCode'),btn=$('fsWrap'),on=fs.classList.toggle('wrap-code');btn.setAttribute('aria-pressed',String(on));});
$('fsCopy')?.addEventListener('click',copyFsSource);
$('codeCopy')?.addEventListener('click',async()=>{await copyFsSource();const b=$('codeCopy');const t=b.textContent;b.textContent='已复制';setTimeout(()=>{b.textContent=t;},1200);});
$('fsLang')?.addEventListener('change',()=>{stop();R1.language=(function(v){return v==='c99'?'c':v;})($('fsLang').value);if(languageSelect)languageSelect.value=R1.language==='c'?'c99':R1.language;render();renderFsCode();});
document.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&fsOpen){e.preventDefault();closeCodeFullscreen();}});
