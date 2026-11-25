# Ubuntu VMware C99 验收

- 系统 Ubuntu 26.04.1 LTS，Linux x86_64
- GCC 15.2.0（Ubuntu 15.2.0-16ubuntu1）、Python 3.14.4、Node v22.22.1
- 传入归档 SHA-256 ad24884048d085fb4a8805c2cba349be8d2f0050e9ebb094f6964690666a2fa5，在 Ubuntu 校验通过
- 工具链解包到来宾临时目录，未安装系统包。Node 官方归档通过随发行版本提供的 SHA-256 文件核对

命令和来宾终端结果

    CC=gcc python3 tests/verify_stdlib_samples.py --model-json model.json
    54 C99 samples compiled and 108 output comparisons passed
    verification_exit=0

    CC=gcc python3 tests/verify_stdlib_samples.py
    54 C99 samples compiled and 108 output comparisons passed
    live_model_exit=0

第一轮使用宿主导出的预期值，第二轮在 Ubuntu 上直接从同一页面模型生成预期值，并对照同一批原生样板。此记录覆盖 Ubuntu x86_64 原生编译及输出。macOS 暂待原生运行。
