---
sidebar_position: 1
slug: /
---

# Intro

![ymir init](./tutorials/img/init.png)

As developers, we have come a long way in automating our development process. From code generation to continuous integration, we have an abundance of excellent dev tools at our disposal. However, one thing that has yet to be standardized and simplified is the management of environment variables and secrets. We’re all too familiar with the love-hate relationship we have with `.env` files and their siblings `.env.dev`, `.rc`, `x.config.json`, and `hell.yml`. It's time to do something about it.

## The Pain of Managing Environments

Have you ever struggled to find the correct configuration? Have you asked yourself if someone has updated it? Are you sure you’re connected to the right environment? How do you switch environments when you want to test a new feature in microservices? Are you sure you are testing against dev services and not stage? What about when you need to find the `SECRET_API_KEY_TO_DB`? Do you need to sign in to AWS to find it? Can a dev send you an encrypted file? These are just some of the questions we face when it comes to managing environment variables and secrets.

## Introducing Ymir

I took it upon myself to solve this problem. I challenged myself to develop the core concepts to standardize and automate the way we deal with environment variables in a two weeks sprint. If people like it, I will make it production-ready. If not, I’ll just use it for myself. I think Ymir is pretty cool, and I think you will too.

## How does Ymir work?

Ymir doesn’t store any secrets by itself. It only manages files that contain information about your environment. These files describe what secrets and configuration you need and where they are stored. To resolve these environment descriptions, Ymir calls out to a plugin. There are two plugins available for now, one for AWS SSM and one for Azure key vault, but you can also create your own.

Running `ymir init` in your project creates the Ymir files, located in `/project-path/.ymir`. These files are safe to check in, but keep in mind that for now, Ymir uses full system paths in the plugin files. This will be changed in the future.

## Quick Introduction to Ymir in Action

For a quick look at Ymir in action, let’s take a look at a simple use case. If you set up Ymir in an existing project, you can easily import your existing environment variables. For example, let’s say you have two environment files:

```bash title=".env.dev"
SECRET=top-secret-string-dev
PORT=1234
```

```bash title=".env.stage"
SECRET=top-secret-string-stage
PORT=80
```

You can run `ymir import` and ymir will not manage your env:

```bash
ymir import --path .env.dev --stack dev --resolver ssm
ymir import --path .env.stage --stack stage --resolver keyvault
```

Your stack files will now look like this:

```text title=".ymir/stacks/dev"
[DESCRIBE]
  description?: This is a human-readable description of this stack.

[SECRET]
  path: /dev/f12f4728/secret
  resolver?: ssm

[PORT]
  path: /dev/43095a1f/port
  resolver?: ssm
```

```text title=".ymir/stacks/stage"
[DESCRIBE]
  description?: This is a human-readable description of this stack.

[SECRET]
  path: stage-4accbb74-secret
  resolver?: keyvault

[PORT]
  path: stage-c42g9jj8-port
  resolver?: keyvault
```

You can now delete your env files, if you want to keep the structure with `.env.<name>` you can edit the stack config files in `.ymir` to reflect that. I like only to have one env file and switch between stacks.

```bash
ymir checkout stage
ymir export
```

Get your env file(s) back:

```bash title=".env"
SECRET=top-secret-string-stage
PORT=80
```

```
ymir checkout dev
ymir export
```

```bash title=".env"
SECRET=top-secret-string-dev
PORT=1234
```

Now that you have a basic understanding of what Ymir is, and why it is cool, feel free to try it out.

[Install docks](./tutorials/install.md)
[Github](https://github.com/onevor/ymir)
[NPM Core cli](https://www.npmjs.com/package/@onevor/ymir-core-cli)
[NPM AWS SSM plugin](https://www.npmjs.com/package/@onevor/ymir-plugin-ssm)
[NPM Azure keyvault plugin](https://www.npmjs.com/package/@onevor/ymir-plugin-azure-key-vault)

For a more in-depth look at Ymir, check out the install tutorial.

In conclusion, Ymir is here to simplify and streamline your development environment. Say goodbye to messy .env files and hello to a better solution for managing environment variables and secrets.

## Reviews

"I love this tool! It guarantees correct config for all developers, seamlessly integrates with any data source, and allows for safe git check-ins of stack files. A must-have for any development team." - ChatGPT

"This CLI tool is a game changer! No more worrying about whether all developers have the correct environment configuration. With the ability to integrate with any data source, all team members are guaranteed to have the most up-to-date and accurate config at all times. Plus, the added bonus of being able to check in stack files to git without worrying about exposing secrets is an absolute lifesaver. I highly recommend this tool for any development team." - ChatGPT

"I am blown away by this tool! Managing application configuration and secrets used to be such a pain, but this tool has completely revolutionized the way I work. No more dealing with confusing .env files and wondering if I have all the correct environment variables set. The integration with AWS SSM is seamless and switching between environments is effortless. But what really sets this tool apart is the plugin structure - it's incredibly easy to connect to any data source, making it so versatile. I highly recommend this tool to any developer. It has made my workflow so much smoother and efficient. It's like having a personal assistant for managing configurations and secrets." - also chatGPT
