---
sidebar_position: 3
---

# Edit a stack

## Prerequisites

Make sure to have [ymir cli installed](../getting-started/install.md)

## Add

To add a new property to a stack you ned to use the `add` method

```bash
ymir add <name> -p [/ssm/path/here]
ymir add -k [name] -p [/ssm/path/here]
```

Add with `<name>` or with `-k` is equivalent. I'm deprecating `-k`.

Flags:

- `[-k|--key <value>]`
  - **Optional**
  - Type: String
  - Alias for the name in `ymir add [name]`
- `[-p|--path <value>]`
  - **Required**
  - Type: String
  - This is the ssm property name
- `[-d|--description <value>]`
  - **Optional**
  - Type: String
  - A human readable description of the property
- `[-r|--resolver <value>]`
  - **Optional**
  - Type: String
  - If this prop uses a different resolver then the default stack resolver, you can add the alias for that resolver here.
- `[-q|--required]`
  - **Optional**
  - Type: Boolean
  - This flag is broken, all properties are required by default. If you want to mark it as optional you should add this flag. But this does not work right now.
- `[-g|--global]`
  - **Optional**
  - Type: Boolean
  - This will add the property to the default stack.
- `[-s|--stack <value>]`
  - **Optional**
  - Type: string
  - By default your property will be added to the current stack (the one you have checked out), if you want to add it to a different stack you can add the name of a stack here.
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Prints help

## Update

To update an existing property in a stack you ned to use the `update` method

```bash
ymir update <name> -p [/ssm/path/here]
ymir update -k [name] -p [/ssm/path/here]
```

Update with `<name>` or with `-k` is equivalent. I'm deprecating `-k`.

All values will be updated, so you need to supply all flags you want to edit as well as the once you want to keep the same.

Flags:

- `[-k|--key <value>]`
  - **Optional**
  - Type: String
  - Alias for the name in `ymir add [name]`
- `[-p|--path <value>]`
  - **Required**
  - Type: String
  - This is the ssm property name
- `[-d|--description <value>]`
  - **Optional**
  - Type: String
  - A human readable description of the property
- `[-r|--resolver <value>]`
  - **Optional**
  - Type: String
  - If this prop uses a different resolver then the default stack resolver, you can add the alias for that resolver here.
- `[-q|--required]`
  - **Optional**
  - Type: Boolean
  - This flag is broken, all properties are required by default. If you want to mark it as optional you should add this flag. But this does not work right now.
- `[-g|--global]`
  - **Optional**
  - Type: Boolean
  - This will update the property in the default stack.
- `[-s|--stack <value>]`
  - **Optional**
  - Type: string
  - By default your property will be updated in the current stack (the one you have checked out), if you want to update it in a different stack you can add the name of a stack here.
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Prints help

## Remove

To remove an existing property from a stack you ned to use the `remove` method

```bash
ymir remove <name>
ymir remove -k [name]
```

Remove with `<name>` or with `-k` is equivalent. I'm deprecating `-k`.

Flags:

- `[-k|--key <value>]`
  - **Optional**
  - Type: String
  - Alias for the name in `ymir add [name]`
- `[-g|--global]`
  - **Optional**
  - Type: Boolean
  - This will remove the property to the default stack.
- `[-s|--stack <value>]`
  - **Optional**
  - Type: string
  - By default your property will be removed from the current stack (the one you have checked out), if you want to remove it from a different stack you can add the name of a stack here.
- `[-h|--help]`
  - **Optional**
  - Type: Boolean
  - Prints help
