# Windows 与 Linux 标准库验收确认

日期 2026-11-25，分支 codex/c-standard-library。范围为当前 C 标准库教学页、C99 样板和既有算法入口。按用户指示暂缓 macOS。

| 平台 | 原生 C99 | 浏览器 |
| --- | --- | --- |
| Windows | MSYS2 GCC 16.2.0，54 份通过严格编译，108 组输出对照通过 | Edge，54 个库函数、77 个既有算法默认入口，暂停继续、时间轴、重跑、全屏、realloc 模拟失败，1440 与 390 像素布局及移动端主题选择通过 |
| VMware Ubuntu 26.04.1 LTS x86_64 | GCC 15.2.0 与 Node 22.22.1，54 份严格编译、108 组输出对照通过 | Firefox 154.0，同批静态页面，54 个库函数、77 个既有算法默认入口、语法着色与说明、暂停继续、时间轴、重跑、全屏、realloc 模拟失败通过 |

- Windows 命令为 python tests/verify_stdlib_samples.py 与 tests/browser_stdlib_delivery.mjs。截图位于 windows-confirmation。
- Ubuntu 来宾直接执行 CC=gcc python3 tests/verify_stdlib_samples.py，退出码 0。来宾归档哈希回读为 ad24884048d085fb4a8805c2cba349be8d2f0050e9ebb094f6964690666a2fa5。宿主逐文件核对归档内 57 份源码与当前工作区字节一致。
- Linux Firefox 以无头模式运行，冒烟页通过回环服务器记录 /__codelens_result?PASS，测试进程退出码 0。结果路径用于记录断言状态，服务器返回 404 是因为该路径没有对应静态文件。布局截图由 Windows Edge 生成。
- 静态构建及清单复验均通过，69 个资源文件见 static-a5dbb862。Windows 首次使用较长的沙箱临时目录报路径错误，改用工作区内短路径后重跑通过。
- 本轮验收范围是教学功能和静态产物。桌面安装包未重新制作或安装。保留功能分支。
