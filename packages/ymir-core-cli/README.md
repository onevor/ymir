# Get started with Ymir

## WARNING: Do not delete your .env

`ymir checkout <stack-name>` and `ymir export`
Will overwrite your `.env` file by default.
**Ymir** assume your `.env` file is already managed by **Ymir**, that is not the case if you integrate ymir with an existing project, without running `ymir import -p .env`

I will make sure **Ymir** does not do this in an upcoming update

## Get started

See full install tutorial [here](https://onevor.no/tutorials/install)

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
ymir install
```

This happens automaticity if you init after installing the plugin, but if you install a plugin after init, you need to tell **Ymir** to update the plugin files.

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
