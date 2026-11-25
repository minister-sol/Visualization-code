# CodeLens 1.1.0 安装包交付与上线评估（2026-11-25）

## 结论

- 已发现并修复的交付缺口：1.0.0 的 Windows、DEB、RPM 三个安装包内嵌的都是 11-24 20:45 的旧静态站点（66 个文件），缺少 11-25 新增的 66 项 C 标准库教学内容、Java 77 语言入口更新、宽屏主栏与背景连击误选修复等改动。
- 现已按当前源码重建三平台安装包（Windows x64 NSIS、Ubuntu amd64 DEB、CentOS x86_64 RPM），版本统一为 1.1.0，内嵌静态站点为 69 个文件 + MANIFEST.json，逐文件哈希与仓库 `web/` 源码一致。
- Windows 安装包与 Ubuntu DEB 已在本机真实安装、启动、交互、卸载验证通过；RPM 已完成元数据、摘要与载荷核验，未在 CentOS 实机安装。
- 已上线：源码提交 `ee435d9`、tag `v1.1.0`、GitHub Release `v1.1.0`（id 457814716）均已完成，三个安装包与校验清单可从公网匿名下载，下载后 SHA-256 与本地产物逐一一致。
- 上线方式为 GitHub Releases 直链下载，README 已加下载入口；默认分支 Pages 站点仍是旧内容，与安装包无关。
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

## 上线结果（公开发布）

- 发布提交：`ee435d91e85b722827e09e9faf3532c0e1aca5b8`（“Ship CodeLens 1.1.0 desktop installers with current 69-file site”），分支 `codex/c-standard-library`；annotated tag `v1.1.0`（远端 tag 对象 `d9591b6`）。
- Release 页面：https://github.com/minister-sol/Visualization-code/releases/tag/v1.1.0（标题「CodeLens 1.1.0 · Windows / Linux 安装包」，HTTP 200）。
- 资产与 GitHub 记录的 digest：

| 资产 | 大小（字节） | GitHub digest / 本地 SHA-256 |
|---|---|---|
| `CodeLens-Setup-1.1.0-x64.exe` | 121,546,449 | `sha256:be4d63cf…1b36155a` |
| `codelens-desktop_1.1.0_amd64.deb` | 130,229,190 | `sha256:82cef597…c1f913fa93` |
| `codelens-desktop-1.1.0-1.x86_64.rpm` | 130,256,551 | `sha256:3977031c…b80764f8ca` |
| `SHA256SUMS-1.1.0.txt` | 326 | 校验清单（Release 现存版本为 CRLF 且带目录前缀，Linux 上建议直接比对上面表格的哈希） |

- 下载入口：`https://github.com/minister-sol/Visualization-code/releases/download/v1.1.0/<文件名>`；README（发布分支与默认分支）均已加「下载安装包（1.1.0）」表格与三条 SHA-256。
- 公网下载核验（匿名、无凭据，在云主机 Ubuntu 上整包下载并比对）：三个安装包大小与本地一致，SHA-256 全部匹配（逐条 `sha256sum` 比对）。Windows 侧因网络重置只能慢速续传（约 19 KB/s），改用云主机完成整包核验。
- 已知限制：GitHub 在国内网络下直链下载速度不稳定；三个包均未代码签名。Release 校验文件为 Windows 生成的 CRLF 版，`sha256sum -c` 在 Linux 上不能直接用，README 给了一行转换命令。
- 账号与凭据：此前 API 报 `403 Sorry. Your account was suspended`，查明是本机 git 凭据所属的旧账号 `zhongjing0412`（其主页已 404）被停用，仓库所有者 `minister-sol` 正常。已换用 minister-sol 的细粒度 token（Contents / Workflows 读写），API 恢复 200，push 正常。
- 后续补齐：Release 新增资产 `SHA256SUMS-1.1.0.txt.asc`（887 字节，id 792036439），并在 Release 说明中追加 GPG 校验步骤；提交作者改用 `359524899+minister-sol@users.noreply.github.com`。

## 未覆盖

- 未签名：Windows 首次运行可能出现 SmartScreen「未知发布者」；Linux 包无 GPG 签名。
- Windows 复验机为本机（PATH 含 Python/Node），非干净机；CentOS 仅做载荷与元数据核验，未在 CentOS 实机安装。
- macOS：现有 DMG 为 1.0.0，未随本轮重新构建（用户本轮明确“mac 版本先不管”）。
- 默认分支 `codex/static-release-20261124` 与发布分支历史不相关（diff 379 文件），其 GitHub Pages 站点（https://minister-sol.github.io/Visualization-code/）仍是旧内容，未同步新站点；安装包内嵌站点已是最新，不受影响。如需页面同步，需另做迁移方案。

