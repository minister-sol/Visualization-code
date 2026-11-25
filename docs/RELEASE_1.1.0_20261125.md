# CodeLens 1.1.0 安装包交付与上线评估（2026-11-25）

## 结论

- 已发现并修复的交付缺口：1.0.0 的 Windows、DEB、RPM 三个安装包内嵌的都是 11-24 20:45 的旧静态站点（66 个文件），缺少 11-25 新增的 66 项 C 标准库教学内容、Java 77 语言入口更新、宽屏主栏与背景连击误选修复等改动。
- 现已按当前源码重建三平台安装包（Windows x64 NSIS、Ubuntu amd64 DEB、CentOS x86_64 RPM），版本统一为 1.1.0，内嵌静态站点为 69 个文件 + MANIFEST.json，逐文件哈希与仓库 `web/` 源码一致。
- Windows 安装包与 Ubuntu DEB 已在本机真实安装、启动、交互、卸载验证通过；RPM 已完成元数据、摘要与载荷核验，未在 CentOS 实机安装。
- 上线条件：GitHub 仓库为公开仓库，写权限当前可用（`git push --dry-run` 成功）；但仓库尚无任何 Release，默认分支仍停在 `codex/static-release-20261124`（80277b9），不含本轮内容。公开发布需要先提交对应源码、建 tag、建 Release 并上传 3 个安装包。
- 仍缺：代码签名证书（三个包均未签名，Windows 会触发 SmartScreen 提示）；干净 Windows 与 CentOS 实机复验；macOS 包为 1.0.0 旧版，不在本轮。

## 1.0.0 与当前源码的差异（交付缺口）

对比 `desktop/site`（1.0.0 打包用站点）与新构建的 `artifacts/site-1.1.0-20261125`：

- 缺失文件 3 个：`c-standard-library.js`、`c-standard-library-remaining.js`、`c-standard-library-guide.js`。
- 内容变更 9 个：`index.html`（未挂载标准库入口、首屏文案与计数未更新）、`classic-catalog.js`、`classic-app.js`、`classic.css`（宽屏主栏修订）、`classic-background.js`（背景连击误选修复）、`classic-java-data.js`、`classic-bubble-ac-adapter.js`、`classic-traversals-preparation.js`、`MANIFEST.json`。
- 其余 58 个文件哈希一致。

## 1.1.0 产物与校验

| 平台 | 文件 | 大小（字节） | SHA-256 |
|---|---|---|---|
| Windows x64 | `artifacts/windows-1.1.0/CodeLens-Setup-1.1.0-x64.exe` | 121,546,449 | `BE4D63CFA1CCFF55074C6B5BA959A6BA4CA26DC6F4C8E00C03E286ED1B36155A` |
| Ubuntu amd64 | `artifacts/linux/codelens-desktop_1.1.0_amd64.deb` | 130,229,190 | `82cef59761cf2ab7798b0952115e1b8e9708cd890d3ca859e22c85c1f913fa93` |
| CentOS x86_64 | `artifacts/centos/codelens-desktop-1.1.0-1.x86_64.rpm` | 130,256,551 | `3977031c1ae0383bd59784f50ecf4f950a89bc84a76bdaa116a825b80764f8ca` |

构建输入：Electron 45.4.1（Windows/Linux x64 zip 均按 `checksums.json` 校验一致）；静态站点由 `scripts/build_static.py` 生成并通过 `--verify`（69 文件 + MANIFEST，无 fetch/XHR/WebSocket/eval/new Function）。

## Windows 验证（本机 Windows 11 x64）

- 安装包完整性标签：`Medium Mandatory Level`（构建后 `afterAllArtifactBuild` 设置），不再是 1.0.0 首版遇到的 Low IL 问题。
- 版本信息：FileVersion 1.1.0，ProductVersion 1.1.0.0，ProductName CodeLens；`Get-AuthenticodeSignature` = NotSigned。
- 内嵌 `resources/app.asar` 共 73 项，`site/` 下 69 个文件与仓库 `web/` 逐文件 SHA-256 比对：69 匹配、0 不一致。
- 静默安装到 `%TEMP%\CodeLens-1.1.0-install`：退出码 0，`CodeLens.exe`、`resources/app.asar` 落盘；`Uninstall CodeLens.exe /S` 后目录消失、进程 0、开始菜单与 `%LOCALAPPDATA%\Programs` 无残留。
- 安装后启动 + CDP 实测（1440×960）：77 个算法入口、67 个标准库下拉项（66 项 + 占位）、标准库脚本与 Java 数据均已加载；冒泡排序 30 步无报错；Java 视图输出 `import java.util.*; class Main`；标准库 `strncmp` 3 步、消息 `读取参数 ["cat","car"]`。
- 证据：`artifacts/acceptance-desktop/20261125/windows-smoke.txt`、`windows-smoke-1440.png`。

## Linux 验证（云主机 Ubuntu 22.04.5 LTS x86_64，原生）

- DEB：`dpkg -i` 安装成功（1.1.0），`/opt/codelens/codelens` 与 `chrome-sandbox`（`rwsr-xr-x`，setuid root）就位；安装目录站点 `--verify` 通过。
- RPM：`rpm -qip` 元数据 1.1.0-1、`rpm -K` 摘要 OK；解包后 150 个条目，内嵌站点 `--verify` 通过，`chrome-sandbox` setuid 位保留。
- 运行：Xvfb 1440×960 启动已安装 DEB 程序，CDP 实测 77 个算法入口、67 个标准库项、冒泡 30 步、`strncmp` 3 步、Java 视图正常；`Browser.close` 后残留进程 0。
- 证据：`artifacts/acceptance-desktop/20261125/linux-evidence-1.1.0.md`、`linux-smoke-1440.png`。

## 未覆盖与上线判断

- 未签名：Windows 首次运行可能出现 SmartScreen「未知发布者」；Linux 包无 GPG 签名。
- Windows 复验机为本机（PATH 含 Python/Node），非干净机；CentOS 仅做载荷与元数据核验，未在 CentOS 实机安装。
- macOS：现有 DMG 为 1.0.0，未随本轮重新构建。
- 发布通道：GitHub `minister-sol/Visualization-code` 为公开仓库，`git push --dry-run` 成功，说明写权限可用；但当前远端只有 `codex/c-standard-library`（b3e8052）与 `codex/static-release-20261124`（80277b9），本地 `codex/c-standard-library` 的 97daff6（Java 77 集成）尚未推送，且工作树还有 11 个已改文件与大量未跟踪内容。
- 因此「可下载上线」在技术上已具备：提交本轮源码 → 打 tag `v1.1.0` → 建 GitHub Release → 上传三个安装包 + `SHA256SUMS`。当前未执行任何提交、推送、Release 或部署。
