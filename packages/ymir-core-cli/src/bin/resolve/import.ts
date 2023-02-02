import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';

import { StackSource } from '../../lib/types/stack';

import * as helper from '../../lib/config/helper';
import * as getPlugin from '../../lib/plugin/get-plugin';
import * as getStack from '../../lib/stack/get';
import * as fs from '../../lib/config/helper/fs';
import { isInProject, validateRequiredProps } from '../lib/index';
import * as help from '../lib/help';

function getEnvPath(args: any, ctx: any) {
  const { cwd } = ctx;
  const { path } = args;

  if (path.substring(0, 6) === '/Users') {
    return path;
  }

  return nodePath.join(cwd, path);
}

export async function getEnvData(args: any, ctx: any) {
  const path = getEnvPath(args, ctx);
  try {
    const data = await fs.readFile(path, 'utf8');
    return [null, dotenv.parse(data)];
  } catch (error) {
    console.error('Error reading env file', error);
    return [
      {
        code: 'UNABLE_TO_READ_FILE',
        message: 'Unable to read env file',
        path,
      },
      null,
    ];
  }
}

export function getResolverToUse(opt: any, stackSource: StackSource) {
  if (opt.resolver) return [null, opt.resolver];
  const [defaultResolverErr, defaultResolver] =
    getPlugin.defaultResolver(stackSource);

  if (defaultResolverErr) return [defaultResolverErr, null];

  return [null, defaultResolver];
}

export async function importStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [
    { name: 'path', alias: 'p', type: String },
    { name: 'stack', alias: 's', type: String },
    { name: 'resolver', alias: 'r', type: String },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: args });

  const [isValid, valMessage] = validateRequiredProps(
    opt,
    ['path', 'stack'],
    ctx
  );

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  // TODO: add help

  const ymirPath = await helper.ymirProjectFolderPath(cwd);
  const stackSource = await getStack.stackSource(ymirPath, opt.stack);

  const [resolverAliasErr, resolverAlias] = getResolverToUse(opt, stackSource);

  if (resolverAliasErr) {
    console.error('No resolver was found', resolverAliasErr);
    return;
  }

  // TODO: validate resolver

  const [envDataErr, envData] = await getEnvData(opt, ctx);
  if (envDataErr) {
    console.error('Unable to read env file', envDataErr);
    return;
  }

  console.log('envData', envData);
  return;
}
