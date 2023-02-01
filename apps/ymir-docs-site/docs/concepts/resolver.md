---
sidebar_position: 1
---

# Resolver

Ymir **does not** store any config or secrets, it only stores information **about** config and secrets.

## Secrets and where to find them

Ymir does not know how to find your secrets, but resolvers do. Resolvers are plugins you can install, so that Ymir can manage your secrets.

You can use the official plugins or you can create your own.

## Official Resolvers

1. AWS SSM resolver: `@onevor/ymir-plugin-ssm`
2. Azure key vault: `@onevor/ymir-plugin-azure-key-vault`

We plan to add more resolvers; if you have suggestions for resolvers we should add
pleas create an [issue her](https://github.com/onevor/ymir/issues)

## Make your own resolver

Resolvers are simple creatures, you can make your own with a few lines of code.
Take a look at the [existing resolvers](https://github.com/onevor/ymir)

For now the only methods required in a resolver is:

1. `resolveOne`
2. `resolveAll`

```typescript
export async function resolveOne(
  props: BaseProperties,
  ctx: any
): Promise<string> {
  return 'secret';
}

export async function resolveAll(
  env: BaseProperties[],
  ctx: any
): Promise<[string | null, string | null][]> {
  return [[`<ENV_KEY>`, `secret`]];
}
```

We have not yet made a stable API for resolvers, so this is open for change.

The methods take in `BaseProperties`([]) and `ctx`

```typescript
type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};
```

`BaseProperties` is compiled data from your stack and config files.
`ctx` contains the resolver config from your stack config files;

To understand this data let us take a look at the ymir files used when you run `ymir export`:

Let us say this is the content of the current stack you have checked out.

```txt title=".ymir/stacks/dev"
[PORT]
  path: /dev/test/secure/port

[KEY]
  path: dev-test-az-key
  resolver?: keyvault
```

This is the content of your default stack

```txt title=".ymir/stacks/default"
[LOG_VERBOSE]
  path: /default/test/secure/verbose
  required?: false
```

This is the content of your default stack config

```txt title=".ymir/stack-config/default"
[DESCRIBE]
  name: project-name;
  description?: This is the default config for all stacks
  ymir_version: 0.0.1; The version of ymir that this config is compatible with
  project_version: 0.0.1; Should mirror the git tag and or npm tag

[FILE]
  path: ./; Relative to the project root;
  name: .env; The name of the file
  description?: This is the default dot env file for all stacks

[DEFAULT_RESOLVER]
  name: ssm; alias for the resolver
  description?: Resolver for AWS SSM

[RESOLVER_CONFIG_KEYVAULT]
  alias: keyvault; alias for the resolver
  vault_name: ymir-test-vault; The name of the keyvault

[RESOLVER_CONFIG_SSM]
  alias: ssm; alias for the resolver
  test: ymir-test-vault; The name of the keyvault
```

And your stack config is empty; values here will overwrite the default stack config, but we can work with the default for this.

```txt title=".ymir/stack-config/dev"

```

As you can see from the default stack config, we have two resolvers. So we also should have two plugin files:

```txt title=".ymir/plugins/ssm"
[DESCRIBE]
  alias: ssm
  pk_name?: @onevor/ymir-plugin-ssm

[LOCATION]
  path: /Users/.../node_modules/@onevor/ymir-plugin-ssm
  install_cmd?: npm i -D @onevor/ymir-plugin-ssm
  is_global?: false

```

```txt title=".ymir/plugins/keyvault"
[DESCRIBE]
  alias: keyvault
  pk_name?: @onevor/ymir-plugin-azure-key-vault

[LOCATION]
  path: /Users/.../node_modules/@onevor/ymir-plugin-azure-key-vault
  install_cmd?: npm i -D @onevor/ymir-plugin-azure-key-vault
  is_global?: false

```

From this data we can create the `ctx` and `BaseProperties`:

Ymir will extract all resolvers it can find:
In the config, we first pull out the DEFAULT_RESOLVER

```
[DEFAULT_RESOLVER]
  name: ssm; alias for the resolver
  description?: Resolver for AWS SSM
```

Now ymir knows that if no other resolver is given this is the one we should use. A stack can have as many resolvers as you would like, you can define what resolver to use on the property, so we need to find all of them as well.

In our example we only have one other resolver:

```
[KEY]
  path: dev-test-az-key
  resolver?: keyvault
```

Ymir now have a list of resolvers: `['ssm', 'keyvault']`
Now ymir will validate that these resolvers are installed, by looking for the files `.ymir/plugins/ssm` and `.ymir/plugins/keyvault`. If the files exists, ymir gets the install paths from the plugin file to validate that the plugins are installed.

Some resolvers might have additional config they need in order to fetch. Like azure key vault, needs to know what key vault you want to connect to.

this information is taken from

```
[RESOLVER_CONFIG_KEYVAULT]
  alias: keyvault; alias for the resolver
  vault_name: ymir-test-vault; The name of the keyvault
```

Here we use the alias in `[RESOLVER_CONFIG_KEYVAULT]` to link it up to the right plugin.
this data is parsed and becomes the `ctx`.

so now we have the `ctx` that will be passed to the azure key vault resolver:

```typescript
const ctx = {
  alias: 'keyvault',
  vault_name: 'ymir-test-vault',
};
```

From the stack files we have three keys:

1. PORT
2. KEY
3. LOG_VERBOSE

And the props all have a path parameter.

And they make up the path and key properties in `BaseProperties`.
You can ignore value for now, this is the actual secret value. The plugins support adding secrets to the secret managers, but ymir does not yet support this. Again ymir does not store secret values, but it can fetch them from a secret manager with a resolver, and soon it will be able to set, update and remove secrets from your secret manager with the resolvers.

You can ignore config too, for now. It is not implemented yet.

```typescript
type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};
```
