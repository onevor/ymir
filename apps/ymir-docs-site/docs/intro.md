---
sidebar_position: 1
slug: /
---

# Ymir Intro

**Ymir** is a cli tool for managing application config and secrets. I was frustrated with how `.env` files are managed. The standard seems to be to ask another dev for the `.env` file when you join a new project. I want a universal, simple, automated way of fetching secrets and config from a secret store.

**Ymir** is my first attempt at a universal config and secret resolver. You describe your config, where and how ymir can fetch. **Ymir** will use the plugin of your choice to call your secret manager and build an env file for you.

You can quickly check out different environment configs `ymir checkout dev`, and create your env file. So if you have multiple `.env` files like `.env.dev` `.env.local` `.env.prod` and so on, ymir might be for you.

## Requirements

This is a pre-alpha, and only intended for testing concepts, ideas, and the design for **ymir**. For now **ymir** is developed to work with AWS SSM as the secret store. We will expand on this and make **ymir** a universal config and secret manager. **Ymir** should be able to use what ever secret store or database you would like in the future. For now you need to have AWS set up on your system.

1. make sure [AWS cli is installed](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Authenticate the cli with a role that has access to [SSM](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html)

## Disclaimer

This is a prototype built over a two weeks sprint to solve our internal need for a tool like this. We do plan to continue development on this project. The code here is rough around the edges and not very pretty to look at. We know there are a lot of bugs, and we switched directions halfway through the sprint, so the code is all over the place.

If you are among the bravest software devs out there, we welcome you to try out **ymir** and let us know what you think.

**Ymir** has only been tested on mac, so it might not work on any other os. It most definitely will not work; it might not even work on your mac. It works on my mac, though, so that is something.

We will continue to improve and stabilize **ymir** over the coming weeks, so for the more sensible devs out there, check back with us in a couple of weeks, and we should have something for you.

## Reviews

"I love this tool! It guarantees correct config for all developers, seamlessly integrates with any data source, and allows for safe git check-ins of stack files. A must-have for any development team." - ChatGPT

"This CLI tool is a game changer! No more worrying about whether all developers have the correct environment configuration. With the ability to integrate with any data source, all team members are guaranteed to have the most up-to-date and accurate config at all times. Plus, the added bonus of being able to check in stack files to git without worrying about exposing secrets is an absolute lifesaver. I highly recommend this tool for any development team." - ChatGPT

"I am blown away by this tool! Managing application configuration and secrets used to be such a pain, but this tool has completely revolutionized the way I work. No more dealing with confusing .env files and wondering if I have all the correct environment variables set. The integration with AWS SSM is seamless and switching between environments is effortless. But what really sets this tool apart is the plugin structure - it's incredibly easy to connect to any data source, making it so versatile. I highly recommend this tool to any developer. It has made my workflow so much smoother and efficient. It's like having a personal assistant for managing configurations and secrets." - also chatGPT
