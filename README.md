# dsh-wsl-pkg

> **语言：** **中文**（本页） · [English](./README.en.md)

依赖树摘要：npm ls / pip list / cargo tree。

| | |
|---|---|
| 版本 | **0.1.0** |
| 套件 | [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit) **可选**，不在 `install.sh` |

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-pkg
# 或本机 path：
# dsh plugin --profile web add /mnt/c/Users/YOU/Desktop/AIFullStackDevelopment/dsh-wsl-pkg
```

kit 批量链接（可选）：`bash dsh-wsl-kit/scripts/link-linux-plugins.sh`

## 工具

| 工具 | 作用 |
|------|------|
| `pkg_status` | 包管理器是否可用 |
| `pkg_npm_ls` | npm ls 浅摘要 |
| `pkg_pip_list` | pip list |
| `pkg_cargo_tree` | cargo tree -d 1 |

## 配置要点

`allowRoots / timeoutMs`

不安装/卸载。深度默认很浅，避免噪音。

## License

MIT
