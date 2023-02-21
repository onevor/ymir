import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';

import { StackSource, YmirPath } from '../../lib/types/stack';

import * as helper from '../../lib/config/helper';
import * as trans from '../../lib/config/parser/transpiler';
import * as getPlugin from '../../lib/plugin/get-plugin';
import * as loadPlugin from '../../lib/plugin/load-plugin';
import * as getStack from '../../lib/stack/get';
import * as updateStack from '../../lib/stack/update';
import * as validatePlugin from '../../lib/plugin/validate';
import * as fs from '../../lib/config/helper/fs';
import { isInProject, validateRequiredProps } from '../lib/index';
import * as help from '../lib/help';

import { logger } from '../../lib/util/logger';

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
    logger.error('Error reading env file', error);
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

export async function getStackToUse(ymirPath: YmirPath, opt: any) {
  if (opt.stack) return [null, opt.stack];
  const [currentStackError, currentStack] = await getStack.currentStack(
    ymirPath
  );

  return [currentStackError, currentStack];
}

export async function getResolverConf(
  ymirPath: YmirPath,
  stackSource: StackSource,
  resolverAlias: string
) {
  const [resolverConfErr, resolverConf] = await getPlugin.configByStackSource(
    ymirPath,
    stackSource
  );

  if (resolverConfErr) return [resolverConfErr, null];

  if (!Object.hasOwnProperty.call(resolverConf, resolverAlias)) {
    const [resolverConfAErr, resolverConfA] = await getPlugin.configByAlias(
      ymirPath,
      stackSource,
      resolverAlias
    );

    if (resolverConfAErr) return [resolverConfAErr, null];

    resolverConf[resolverAlias] = resolverConfA[resolverAlias];
  }

  return [null, resolverConf];
}

export async function importStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [
    {
      name: 'path',
      alias: 'p',
      type: String,
      description: 'Path to .env file',
    },
    {
      name: 'stack',
      alias: 's',
      type: String,
      description:
        'The name of the stack you want to add to,\n\t\tuses the current stack by default',
    },
    {
      name: 'resolver',
      alias: 'r',
      type: String,
      description:
        'The alias for the resolver to use, uses the default resolver by default',
    },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(
      def,
      'Import an existing .env file',
      help.getUsageText('import')
    );
  }

  const [isValid, valMessage] = validateRequiredProps(opt, ['path'], ctx);

  if (!isValid) {
    logger.error(valMessage);
    return;
  }

  const ymirPath = await helper.ymirProjectFolderPath(cwd);
  const [targetStackErr, targetStack] = await getStackToUse(ymirPath, opt);

  if (targetStackErr) {
    logger.error('Unable to get stack', targetStackErr);
    return;
  }

  const stackSource = await getStack.stackSource(ymirPath, targetStack);
  const [resolverAliasErr, resolverAlias] = getResolverToUse(opt, stackSource);

  if (resolverAliasErr) {
    logger.error('No resolver was found', resolverAliasErr);
    return;
  }

  const [pluginValErr, pluginVal] = await validatePlugin.byAlias(
    ymirPath,
    resolverAlias
  );

  if (pluginValErr) {
    logger.error('Unable to validate plugin', pluginValErr);
    return;
  }

  const [envDataErr, envData] = await getEnvData(opt, ctx);
  if (envDataErr) {
    logger.error('Unable to read env file', envDataErr);
    return;
  }

  const [resolverConfErr, resolverConf] = await getResolverConf(
    ymirPath,
    stackSource,
    resolverAlias
  );

  if (resolverConfErr) {
    logger.error('Unable to get resolver config', resolverConfErr);
    return;
  }

  const [resolverLoadErr, resolverLoad] = await loadPlugin.importEnvData(
    envData,
    resolverConf,
    resolverAlias,
    targetStack
  );

  if (resolverLoadErr) {
    logger.error('Unable to load resolver', resolverLoadErr);
    return;
  }

  const stackData = trans.transpilePropertiesToStackObject(resolverLoad, {
    resolver: resolverAlias,
  });

  const [updateErr, update] = await updateStack.getAndMerge(
    ymirPath,
    targetStack,
    stackData
  );

  if (updateErr) {
    logger.error('Unable to update stack', updateErr);
    return;
  }
  logger.log('Imported stack successfully: \n', update);
  return;
}
