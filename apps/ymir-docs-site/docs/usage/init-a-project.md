---
sidebar_position: 1
---

# Init a project

## Prerequisites

Make sure to have [ymir cli installed](../getting-started/install.md)

## Init

Create a new ymir project. You should do this in the root of your project.

```bash
ymir init
```

All methods have **help** `-h|--help`

Init have two optional flags you can supply;

- `[-p|--relativePath <value>]`
- `[-f|--absolutePath <value>]`

You can tell ymir where to init the project `-p` takes in a relative path from your current `cwd`; and `-f` takes an absolute file path.
