# C 标准库函数教学计划 · 2026-11-24

负责人为本聊天 Codex。当前交付为计划，以下实施批次均待执行。分支 codex/c-standard-library 从 main 的 d42dfd5 建立。当前工作树含既有未提交的算法成果。实施前记录相关文件指纹、确认可重建的算法基线与拟集成目标差异；只按功能路径审阅差异，避免整目录暂存。全部验收前禁止合并至任何其他分支。

## 每个函数的交付单元

一个目录入口、一份独立可编译的 C11 样板、一组可编辑数据和可恢复默认值。沿用既有算法样板的中文讲解、代码样式、当前行映射、输出及播放控制；实施第一步对照实际算法页逐项记录现有约定。演示从本次数据生成调用步骤，呈现调用前参数、调用行、返回值、输出或对象变化。只展示标准保证的行为。函数主题在原图示位置显示头文件与原型、参数和单位、返回与失败、调用前提、典型误用和本次输入的解释。保持相同页面布局、配色、字号、导航和响应式规则。

## 执行次序与验收

- [x] A 基线和纵向样例。检查 web/index.html、web/classic-catalog.js、现有 teaching 样板、tests 下编译和浏览器用例。记录原 77 主题及快照。先做 strlen，一个空串与一个自定义字符串贯通输入、样板、返回值、步进和说明。示范字节长度与终止符。
- [x] B 字符串、内存和字符。补 strcmp strncmp strcpy strcat strchr strstr；memcpy memmove memset memcmp；isdigit isalpha isalnum isspace toupper tolower。检查目标容量含终止符、重叠规则、比较结果的符号及 ctype 参数范围。
- [x] C 输入输出和转换。printf scanf getchar putchar puts fgets snprintf；atoi strtol strtod。允许改输入文本和相关容量，使用样板指定的格式。检验匹配数、EOF、换行、截断、转换结束位置与范围错误。atoi 样板限定可表示输入。
- [x] D 动态内存、排序查找。malloc calloc realloc free qsort bsearch。用数组大小、元素和查找键驱动演示。核对分配失败分支、扩容后的指针、释放时机、排序比较器与有序查找前提。qsort 的内部算法及比较顺序不作标准承诺。
- [x] E 文件。fopen fclose fprintf fscanf fread fwrite fseek ftell。输入为示例文件内容、记录或偏移。页面使用隔离的演示文件，原生样板使用临时测试目录。验证打开失败、短读、返回计数和文件位置。
- [x] F 数学、随机和时间。sqrt pow fabs floor ceil round sin cos；rand srand time difftime clock。核对定义域、弧度、负数取整、浮点容差；随机序列与计时展示标注实现和环境，按性质验收。
- [ ] G 联合验收。逐函数登记标准条款、默认输入、自定义输入、边界或错误输入、编译命令和结果；将页面输出与原生 C 对照，按标准允许范围判断。检查目录可达、代码行与步骤一致、重跑、暂停、重置、切换主题和窄屏。复验现有算法入口、历史快照及代表性回放。提交验收清单、日志和界面对照图，记录遗留项。全部通过后交用户审阅合并。

各批依赖 A 的页面和样板约定，G 依赖 A–F。每批由 Codex 更新 EXECUTION_PLAN.md，列出函数清单、测试结果与待补项。目前无需转发任务。

### 2026-11-25 验收记录

- 豆包 C–F 的 8 个用例套件由 Codex 使用 GCC 严格 C11 模式独立复跑，151 项断言全部通过。
- 54 份教学样板严格编译通过，逐项对比默认与边界/自定义输入共 108 组，另有 12 组无效输入在调用前被拦截。
- Edge 1440 与窄窗口配置跑过 54 个主题的调用行、输出、重置和代表性自定义输入。随后逐项检查 77 个既有主题的默认运行和首步。
- 页面采用浏览器模型；rand/srand 检查标准性质，clock 检查可用计时差，文件例子使用页内数据和原生临时目录。realloc 样板展示失败处理代码，页面回放常规尺寸的成功路径；本机分配失败由豆包用例覆盖。
- G 尚待独立的暂停/恢复与布局截图验收，以及跨平台验证。功能留在 codex/c-standard-library。
### 2026-11-25 问题十八至二十与联合验收

- 算法与标准库使用独立选择控件，窄屏保留算法弹窗。主题下显示中文用法和原型，说明区按参数、前提、返回值、影响、示例与易错点分段，重点用 mark 标注。
- C 样板统一以 C99 严格编译，复用算法编辑区语法着色和当前行样式。realloc 可输入 failure 模拟分配器返回 NULL，展示旧指针仍有效。
- python tests/verify_stdlib_samples.py 通过，54 份源码与页面显示一致，108 组原生结果对照通过。静态构建清单核验通过，含 69 个文件。
- tests/browser_stdlib_delivery.mjs 通过，覆盖 54 项语法着色与讲解、77 项既有主题默认运行、播放暂停继续、时间轴、修改后重跑、全屏、realloc 失败回放、宽窄布局和移动端算法弹窗。截图 artifacts/acceptance-stdlib/20261125 下 4 张。
- G 的本地验收通过。Linux/macOS 原生验收仍待实测。当前主机未注册可用 Ubuntu WSL 发行版，未发现可直接使用的 macOS 环境。可在目标平台运行同一 Python 验收脚本，使用环境变量 CC 选择编译器。功能仍在 codex/c-standard-library。
2026-11-25 VMware Ubuntu 26.04.1 LTS x86_64 原生验收已通过。GCC 15.2.0，C99 严格编译 54/54，原生输出对照 108/108。另用 Ubuntu 上的 Node v22.22.1 实时生成预期值再跑，结果一致。证据见 artifacts/acceptance-stdlib/20261125/ubuntu-native.md。G 剩 macOS 原生验收。
2026-11-25 按用户指示暂缓 macOS。G 在 Windows 和 VMware Ubuntu 范围验收通过：两端 54/108 原生对照复跑，Edge 与 Firefox 网页验收通过，Windows 宽窄截图已留存，静态产物清单 69 文件通过。详情 artifacts/acceptance-stdlib/20261125/windows-linux-confirmation.md。
