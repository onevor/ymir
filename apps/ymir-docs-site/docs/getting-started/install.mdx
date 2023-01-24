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
ymir stack -l
```

You should see a list that looks a little like this:

```
Stacks:
	* dev
	default
	prod
	stage
```

If you do not... It is probably my bad. This is a pre-pre-alpha, I'm working on it. Let me know if you were unable to install it.

## Setup CLI

You are almost ready to use ymir now, there is only one last thing we need to do to try it out.
To use the cli you need to install at least one [resolver](../concepts/resolver.md)
For now you need to do a little manual work to get a resolver up and running.

:::danger Resolver api

The resolver API has not been defined yet; that is the next big thing on my **TODO** list.
For now, I have a very basic test resolver for **AWS SSM**

:::

Like with the core cli you can install it globally or in your node project. I would recommend you install this one in your project.
If you are working with in a node project.

```bash
npm i -D @onevor/ymir-plugin-ssm
```

For a global install:

```bash
npm i -g @onevor/ymir-core-cli
```

Now get ready for the manual work; we need to tell ymir about this plugin.

:::tip NOTE

**Ymir** will be able to register this plugin by itself in a future version, so this is temporary.

:::

First, you need to find the location of the installed plugin.

If there is no `package.json` file in a folder above the one you installed the plugin, you can do this:

```bash
echo $(npm root)/@onevor/ymir-plugin-ssm
```

And if you did a global install:

```bash
echo $(npm root -g)/@onevor/ymir-plugin-ssm
```

If this does not work for you, or you are a rebel and installed it somewhere else;
You have to find the path to the plugin path.

Now let us tell ymir where the plugin is in your project (where you did `ymir init`):

```bash
ymir install -p [the path you found above] -r ssm
```

Here we are telling ymir where the installed plugin exists on the file system, and we are giving it an alias.
The alias can be whatever you want, it is a shorthand for the full resolver name `@onevor/ymir-plugin-ssm` it is used in your [stack files](../concepts/stack-file.md)
and your [stack config files](../concepts/stack-config-file.md) to tell ymir what plugin to load. Ymir looks up your [plugin files](../concepts/plugin-file.md) based on the alias.

## Done

You are now set, ymir should be up and running in your project;
