import * as Chalk from 'chalk';
import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import * as installLib from '../../lib/resolve/lib/resolver-operations/install';

import { isInProject, validateRequiredProps } from '../lib/index';

import * as help from '../lib/help';
import * as reg from '../../lib/plugin/register-plugin';

const chalk: any = Chalk;

const legacyInstallDef = [
  { name: 'name', alias: 'n', type: String },
  { name: 'alias', alias: 'a', type: String },
  { name: 'install', alias: 'i', type: Boolean },
  { name: 'global', alias: 'g', type: Boolean },
  { name: 'path', alias: 'p', type: String },
];

const resolvePluginsDef = [{ name: 'force', alias: 'f', type: Boolean }];

/**
 * If you install the same path with different names
 * it will create a new file, and not remove the old one
 *
 * TODO: should have options for overwrite/delete old
 *
 * TODO: bydefault call the plugin resolver to create plugin files
 * add -f to overwrite existing files
 */
export async function legacyInstall(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [...legacyInstallDef, help.def];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Install a plugin');
  }

  const [isValid, valMessage] = validateRequiredProps(opt, ['alias'], ctx);

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const options = {
    name: opt.name || null,
    alias: opt.alias || null,
    global: opt.global || false,
    path: opt.path || null,
  };
  const isInstallByPath = !!options.path && !!options.alias;
  const isInstallByName = !!options.name && !!options.alias;
  const hasBase = isInstallByPath || isInstallByName;

  if (!hasBase) {
    const missingPropsErrorHead = `Missing required properties for install command:\n`;
    const missingPropsErrorExplanation = `Need to supply either\n\t--name|-n [npm package name]\n\t--alias|-a [alias name for plugin]\n\tor\n\t--path|-p [path to the installed package]\n\t--alias|-a [alias name for plugin]`;
    console.error(`${missingPropsErrorHead}${missingPropsErrorExplanation}`);
    return;
  }

  if (isInstallByPath) {
    console.log('Installing plugin by path...\n');
    const ymirPath = helper.ymirProjectFolderPath(cwd);
    const [error, response] = await installLib.installPluginWithPath(
      ymirPath,
      opt.path,
      opt.alias,
      {}
    );

    if (error) {
      console.error(
        `Error installing plugin: \n\tCODE:\n\t\t"${error.code}"\n\tMESSAGE:\n\t\t"${error.message}"`
      );
      return;
    }
    console.log('Plugin installed successfully');
    return;
  }

  if (isInstallByName) {
    console.log('Installing plugin by name...\n');
    console.error('Not implemented yet');
    return;
  }

  console.error('Error: invalid code path, should not be able to get here');
}

export async function resolvePlugins(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [...resolvePluginsDef, help.def];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Install plugin(s)', help.getUsageText('install'));
  }

  const force =
    (Object.prototype.hasOwnProperty.call(opt, 'force') && opt.force) || false;

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const pluginPaths = await reg.fullPluginResolve(cwd);

  if (pluginPaths.length === 0) {
    console.warn(chalk.red('\nUnable to locate any plugins to install'));
    return;
  }

  console.log(
    `\nFound ${chalk.green(
      pluginPaths.length
    )} plugins to install:\n\t${chalk.green(pluginPaths.join('\n\t'))}`
  );

  const resolved = await reg.registerPlugins(ymirPath, pluginPaths, force);

  console.log(
    `\n${chalk.green(
      resolved.creating.length
    )} Plugins were installed:\n\t${chalk.green(
      resolved.creating.join('\n\t')
    )}`
  );

  if (resolved.alreadyExists.length !== 0) {
    console.warn(
      `\nUse ${chalk.red('[--force|-f]')} to ${chalk.red(
        'force'
      )} plugin file update.\n\tThe following plugins were already installed:\n\t\t${chalk.red(
        resolved.alreadyExists.join('\n\t\t')
      )}`
    );
  }

  if (resolved.resolved.error.length !== 0) {
    console.error(
      `\n${chalk.red(
        'The following plugins had errors:'
      )}\n\t${resolved.resolved.error.join('\n\t')}`
    );
  }
}

export async function install(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [...legacyInstallDef, ...resolvePluginsDef, help.def];

  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Install plugin(s)', help.getUsageText('install'));
  }

  const hasLegacy = Object.keys(opt).some((key) =>
    legacyInstallDef.some((def) => def.name === key)
  );

  if (hasLegacy) return legacyInstall(args, ctx);

  return resolvePlugins(args, ctx);
}
