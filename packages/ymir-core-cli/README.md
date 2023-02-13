# Streamlining Your Development Environment with Ymir: Say Goodbye to Messy .env Files

See full install tutorial [here](https://onevor.no/tutorials/install)

## Get started

```bash
npm i -g @onevor/ymir-core-cli
```

You need to install at least one plugin:

```bash
npm i -D @onevor/ymir-plugin-ssm`
```

You can then init ymir in your project: `ymir init`

Let ymir know about your installed plugin:

```bash
ymir install --path "/Users/xxx/project/node_modules/@onevor/ymir-plugin-ssm" --alias ssm
```

For now you need to supply an absolute path, im working on automating this. So that ymir will find your plugins by it self.

You should now be ready to use ymir. Try to import your existing `.env` file:

```bash
PORT=5000
SECRET=top-secret-string
```

```bash
ymir import --path .env
```

You can now delete your env file: `rm .env`

To get it back:

```bash
ymir export
```

Read the full docs at [onevor.no](https://onevor.no)
