---
sidebar_position: 1
---

# Install

**Ymir** can be installed with **NPM**, it is recommended to install it globally, but you can install it in your node project as well.

:::tip NOTE

**Ymir** can be used in projects other than node, but you do for the time being need node and npm installed on your system.

:::

## Install the core cli

Install **ymir** globally:

```bash
npm i -g @onevor/ymir-core-cli
```

or install it in your node project:

```bash
npm i -D @onevor/ymir-core-cli
```

## Setup ymir in your project

All you need to do to set up ymir in your project is:

```bash
ymir init
```

You should do this at the root of your project.

Now you should have ymir running, to check you can run:

```bash
ymir stack
```

You should see a list that looks a little like this:

```
	* dev
	default
	prod
	stage
```

## Setup CLI

To use the cli you need to install at least one [resolver](../concepts/resolver.md)

Like with the core cli you can install it globally or in your node project. I would recommend you install this one in your project.
If you are working with in a node project.

List of official ymir resolvers can be found [here](../concepts/resolver.md)
for this example we will use the AWS SSM resolver.

```bash
npm i -D @onevor/ymir-plugin-ssm
```

For a global install:

```bash
npm i -g @onevor/ymir-core-cli
```

Then you need to tell **Ymir** to look for your new plugins:

```bash
ymir install
```

You can install the plugins before you do the `ymir init` then **Ymir** will create the plugin files without you having to run `ymir install`. When ever you install a new plugin you have to run `ymir install`.

In the future I plan to make **Ymir** find plugins on your system when it needs it, so that you will no longer need to run `ymir install`

Some plugins require extra config to work, for now you need to manually add this config:

Add this to the end of your config file:

```txt title=".ymir/stack-config/default"
[RESOLVER_CONFIG_SSM]
  alias: ssm
  region: <YOUR_AWS_REGION_HERE>

[RESOLVER_CONFIG_KEYVAULT]
  alias: keyvault
  vault_name: <THE_NAME_OF_YOUR_VAULT_HERE>
```

If you have multiple regions/vaults for your stacks add it to your stack specific config: `.ymir/stack-config/<STACK_NAME>`

You can only have one region/vault per stack.
