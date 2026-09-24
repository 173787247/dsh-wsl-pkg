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

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-pkg` **0.1.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.1.7-alpha.2`**) — single source of truth for the suite |
| **Kit set** | optional (not in `install.sh` / `KIT_SET=daily` by default) |

## License

MIT
