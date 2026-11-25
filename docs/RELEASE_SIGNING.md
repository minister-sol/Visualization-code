# 发布签名与校验（CodeLens）

本文件记录当前可用的免费签名手段、密钥信息和操作步骤。Windows Authenticode 证书仍在选型阶段，见文末。

## 1. 现状

| 对象 | 状态 | 手段 |
|---|---|---|
| 三个安装包的完整性 | 已签名 | 校验清单 `SHA256SUMS-1.1.0.txt` + GPG 分离签名 `.asc` |
| deb / rpm 包内签名 | 未做 | 需要嵌入签名，会改变包字节与 SHA-256，须与校验清单同步重出 |
| Windows Authenticode | 未做 | 待 SignPath Foundation 或 Certum 证书 |

## 2. 发布密钥

- 指纹：`761F CD89 CAA6 6C7C 133C 3064 96AB F23B D88A 747B`
- 用户 ID：`CodeLens Release (zhongjing) <zhongjing@users.noreply.github.com>`
- 算法：RSA 4096，仅签名用途，有效期 3 年（2026-11 至 2029-11）
- 公钥：`release/CodeLens-release-key.asc`（随仓库分发，指纹写进 README）
- 私钥：本机 GnuPG 密钥环 `C:\Users\<user>\AppData\Roaming\gnupg`，未设口令

私钥未设口令是为了让脚本和后续 CI 能无人值守签名，代价是本机被盗即可冒签。建议在正式对外长期使用前执行 `gpg --change-passphrase <指纹>` 设置口令，并把吊销证书 `openpgp-revocs.d\761F...rev` 离线备份。

## 3. 发布新版本时

Windows：

```powershell
pwsh -File scripts/sign-release.ps1 -SumsFile release/SHA256SUMS-<版本>.txt -ArtifactsRoot artifacts
```

Linux / macOS：

```bash
./scripts/sign-release.sh release/SHA256SUMS-<版本>.txt artifacts
```

两个脚本都会先逐个重算清单里的哈希，任何不一致直接失败，不会为错误字节产生签名；通过后才写 `.asc` 并立即自校验。清单要覆盖“将来公开的那份原字节”，签名才对得上。

用户侧校验：

```bash
gpg --import CodeLens-release-key.asc
gpg --verify SHA256SUMS-<版本>.txt.asc SHA256SUMS-<版本>.txt
```

## 4. 是否给 deb / rpm 嵌入签名

可选，但要注意连锁影响：

```bash
debsigs --sign=origin -k <key-id> codelens-desktop_1.1.0_amd64.deb
rpm --addsign codelens-desktop-1.1.0-1.x86_64.rpm
```

嵌入后包字节变化 → SHA-256 变化 → 必须重算校验清单、重签 `.asc`、重传 Release 资产。当前 GitHub Release 资产已发布，且账号 API 受限（`403 suspension`），暂不做，等账号恢复后连同 Windows 签名包一起替换。

## 5. Windows Authenticode 待办

1. 补 `LICENSE`（已完成，MIT）——SignPath Foundation 要求 OSI 认可许可证。
2. 申请 SignPath Foundation：需要 GitHub 与 SignPath 账号均开 MFA、构建在 CI 中自动完成、已有 release（v1.1.0 已满足）、README 含 Code signing policy（已添加）。
3. 备选：Certum Open Source Code Signing 云签名（约 €49/年，发布者显示 “Open Source Developer + 姓名”，个人可申请，需身份材料审核）。
4. 拿到证书后：在 `.github/workflows` 增加签名作业，electron-builder 侧使用 SignPath 提交产物或自定义签名钩子；签名后再生成校验清单并 GPG 签名。
5. 预期：签名不会立即消除 SmartScreen 首次提示，需要连续版本累积信誉。

## 6. CI 未签名候选构建（已跑通）

`.github/workflows/windows-candidate.yml` 在 GitHub 托管 runner 上完成完整链路：

1. `python scripts/build_static.py` 生成并 `--verify` 校验站点；
2. `npm ci` + `npm run dist` 产出 `CodeLens-Setup-1.1.0-x64.exe`；
3. 记录 `fileVersion` / `productVersion`、`Get-AuthenticodeSignature` 状态和 SHA-256；
4. 以 `CodeLens-Windows-unsigned` 上传 workflow artifact（zip 约 121 MB，保留 90 天）。

实测记录（2026-11-25）：

- run `45649715715` 首次全绿；签名状态 `NotSigned`，exe `1.1.0`，SHA-256 `80FE7A56…D71CD2`。
- run `45650056079` 为 SignPath v3 接线后的复跑，仍然 build 全绿、sign 按门控跳过。
- 首次失败 run `45649420536` 的根因是 Windows runner 控制台代码页 cp1252 无法输出脚本里的中文提示（`'charmap' codec can't encode`）。修复方式：job 级 `PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8`（提交 `65925e5`）。

注意：CI 产物与本地/Release 上的 exe 字节不同（打包顺序与 elevate 暂存差异），SHA-256 不能互相比对；要以 CI 自己记录的值为准。

## 7. SignPath 接入（代码已就绪，等账号）

签名 job 已按官方文档改为 `signpath/github-action-submit-signing-request@v3`，并用 `needs.build.outputs.artifact_id` 把 build job 上传的 artifact 直接交给 SignPath（不再二次下载）。门控条件是仓库变量 `SIGNPATH_PROJECT_SLUG` 非空。

需要用户完成的事项：

1. GitHub 账号 `minister-sol` 开启 2FA（SignPath 条款硬性要求团队所有成员开 MFA）。
2. 在 https://signpath.org/ 点 Apply，或在 https://signpath.io/solutions/open-source-community 提交申请表：填仓库 `https://github.com/minister-sol/Visualization-code`、下载页 `https://github.com/minister-sol/Visualization-code/releases/tag/v1.1.0`、许可证 MIT、项目简介。审核通常几天到数周，可能邮件追问。
3. 通过后在 SignPath 控制台：
   - Organization ID（GUID）；
   - Project slug，并链接 GitHub.com 这个 trusted build system；
   - Artifact configuration：根节点 `<zip-file>`，内含 `CodeLens-Setup-*.exe` 的 Authenticode 步骤；给 product name / product version 设置 metadata 限制（条款要求）；
   - Signing policy slug（如 `release-signing`），每个 release 需人工批准；
   - 生成 API token（submitter 权限）。
4. 在 GitHub 仓库 Settings → Secrets and variables → Actions 配置：
   - secret `SIGNPATH_API_TOKEN`
   - vars `SIGNPATH_ORGANIZATION_ID`、`SIGNPATH_PROJECT_SLUG`、`SIGNPATH_SIGNING_POLICY_SLUG`、可选 `SIGNPATH_ARTIFACT_CONFIGURATION_SLUG`
5. 重跑 workflow，`sign` job 下载签名后的 exe，`Get-AuthenticodeSignature` 必须为 `Valid`。
6. 用签名后的 exe 替换 Release 资产，重算 `SHA256SUMS-1.1.0.txt`，重签 `.asc`，并同步更新 README 里的三个哈希。

风险：条款写明“可执行程序需要一定的可验证声誉”，新仓库可能被拒；被拒时走 Certum 付费路径，签名代码不用改，只需换成 electron-builder 的 `certificateFile`/云签名钩子。
