# dsh-wsl-pkg

> **Languages:** [中文（首页）](./README.md) · **English** (this file)

Dependency tree summaries: npm / pip / cargo.

| | |
|---|---|
| Version | **0.1.0** |
| Kit | Optional companion to [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit); not in `install.sh` |

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-pkg
```

Batch link (optional): `bash dsh-wsl-kit/scripts/link-linux-plugins.sh`

## Tools

| Tool | Role |
|------|------|
| `pkg_status` | managers on PATH |
| `pkg_npm_ls` | shallow npm ls |
| `pkg_pip_list` | pip list |
| `pkg_cargo_tree` | cargo tree depth 1 |

## Config

`allowRoots / timeoutMs`

No install/uninstall. Shallow by default to avoid noise.

## License

MIT
