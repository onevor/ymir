---
sidebar_position: 2
---

# Stack

## Prerequisites

Make sure to have [ymir cli installed](../getting-started/install.md)

## Stack

The stack method can be used to get information about your stacks.

```bash
ymir stack
```

Running `ymir stack` wil show you what stack you currently have checked out, this is the context ymir will operate under. If you are editing a stack, ymir assumes you want to edit this stack.

Flags:

- `[-c|--current]`
  - **Optional**
  - Type: Boolean
  - List only the current stack you have checked out
- `[-p|--path]`
  - **Optional**
  - Type: Boolean
  - Add the file path to the stack file(s)
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Print help

:::tip NOTE

For now there is no way to inspect the content of a stack. I plan to add this in a future update.
You can use `ymir stack -p` to get the path, then cat the file.

:::

## Checkout

Ymir is designed to work best in the context of one stack. You can checkout a **stack** like you can checkout a **branch** in git.

```bash
ymir checkout <stack-name>
ymir checkout -n [stack-name]
```

`checkout <stack-name>` and `checkout -n [stack-name]` are equivalent.

Flags:

- `[-n|--name <value>]`
  - **Optional**
  - Type: String
  - Alias for name. (deprecated)
- `[-c|--create]`
  - **Optional**
  - Type: Boolean
  - Create the stack before checking it out, simula to `git checkout -b [branch-name]`
- `[-i|--ignoreExport]`
  - **Optional**
  - Type: Boolean
  - Will not export the stack
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Print help

## Create

```bash
ymir create <stack-name>
ymir create -n [stack-name]
```

`create <stack-name>` and `create -n [stack-name]` are equivalent.

Flags:

- `[-n|--name <value>]`
  - **Optional**
  - Type: String
  - The name of the stack to create. (deprecated)
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Print help

## Delete

```bash
ymir delete <stack-name>
ymir delete -n [stack-name]
```

`delete <stack-name>` and `delete -n [stack-name]` are equivalent.

Flags:

- `[-n|--name <value>]`
  - **Optional**
  - Type: String
  - The name of the stack to create. (deprecated)
- `[-f|--force]`
  - **Optional**
  - Type: Boolean
  - If you are trying to delete the branch you have currently checked out, you need to force it.
- `[-c|--checkout <value>]`
  - **Optional**
  - Type: String
  - If you are trying to delete the branch you have currently checked out, you can provide a stack to checkout to. By default ymir will check out the `default` stack.
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Print help

## Export

To use a stack in your application you need to export a `.env` file. This happens by default when you checkout a stack, but you can do it manually with `export`

```bash
ymir export
```

`ymir export` will by default create a `.env` file for the current checked out stack, you can supply the `-s [stack-name]` flag to export a different stack.

To change the export behaviour you can edit the `.ymir/stack-config/[stack-name | default]`

```txt
[FILE]
  path: ./; Relative to the project root;
  name: .env; The name of the file
  description?: This is the default dot env file for all stacks
```

Flags:

- `[-s|--stack <value>]`
  - **Optional**
  - Type: String
  - The name of the stack to export.
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Print help
