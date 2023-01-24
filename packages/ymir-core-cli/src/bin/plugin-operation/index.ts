import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import * as installLib from '../../lib/resolve/lib/resolver-operations/install';

import { isInProject, validateRequiredProps, helperDef } from '../lib/index';

/**
 * If you install the same path with different names
 * it will create a new file, and not remove the old one
 *
 * TODO: should have options for overwrite/delete old
 */
export async function install(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [
    { name: 'name', alias: 'n', type: String },
    { name: 'alias', alias: 'a', type: String },
    { name: 'install', alias: 'i', type: Boolean },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'path', alias: 'p', type: String },
    helperDef,
  ];
  const opt = commandLineArgs(def, { argv: args });

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
