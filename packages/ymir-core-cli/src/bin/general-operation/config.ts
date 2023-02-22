import * as Chalk from 'chalk';
import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import stack from '../../lib/stack';
import * as trans from '../../lib/config/parser/transpiler';

import { isInProject, parseSubCommand } from '../lib/index';

import * as help from '../lib/help';

const chalk: any = Chalk;

import { logger, logError } from '../../lib/util/logger';

/**
 * Should be able to add config to the stacks here
 *
 * - add default resolver
 * - add resolver config
 *   - should ask installed resolvers what they need
 * - change output file
 *
 */

/**
 * TODO: BUG:
 * - Resolver update markes all other props as optional, need a global fix for this
 * - need a config file schema that can mark props, or i need to switch it out to toml soon.
 */

const resolverConfigHeader = (alias: string) =>
  `RESOLVER_CONFIG_${alias.toUpperCase()}`;
const resolverDefaultHeader = 'DEFAULT_RESOLVER';

export async function configFile(args: any, ctx: any) {
  const { cwd } = ctx;
  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    {
      name: 'path',
      alias: 'p',
      type: String,
      description:
        'Path to where env file should be created, relative to project root',
    },
    {
      name: 'stack',
      alias: 's',
      type: String,
      description:
        'The name of the stack to add config to, default to default stack',
    },
    help.def,
  ];

  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Edit the resolver config',
      help.getUsageText('config file', '<fileName>')
    );
  }

  const targetStack = opt.stack || 'default';

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [configFileError, configFile] = await stack.get.getConfig(
    ymirPath,
    targetStack
  );

  if (configFileError) {
    return logError(configFileError);
  }

  const [parsed, comments] = trans.parseStackFile(configFile);

  const envFileName = subCommand || parsed['FILE'].name || null;
  const filePath = opt.path || parsed['FILE'].path || './';

  if (!envFileName) {
    return logger.error(
      `Please specify a file name: ${help.getUsageText(
        'config file',
        '<fileName>'
      )}`
    );
  }

  logger.info(`${chalk.green('Using')} ${chalk.bold(filePath)} as path`);
  logger.info(
    `${chalk.green('Using')} ${chalk.bold(envFileName)} as file name`
  );

  const content = { ...parsed };
  content['FILE'] = {
    ...parsed['FILE'],
    path: filePath,
    name: envFileName,
  };

  const configData = trans.transpileObjectToStack(content, comments, [
    'path',
    'name',
  ]);

  return stack.update.updateConfigFile(ymirPath, targetStack, configData);
}

export function parseResolverConfigFromOpt(config: string[]): [string[], any] {
  const errors = [];
  const configObj = {};
  config.forEach((c) => {
    const clean = c.trim();
    if (clean.includes('=')) {
      const [key, value] = c.split('=');
      if (!key || !value) {
        errors.push(clean);
      }
      configObj[key] = value;
    } else {
      errors.push(clean);
    }
  });
  return [errors, configObj];
}

export function getAllRequiredProps(data) {
  const entries = Object.entries(data);
  const requiredProps = ['name', 'alias'];

  entries.forEach(([key, value]) => {
    if (key.substring(0, 16) === resolverConfigHeader('')) {
      const props = Object.keys(value);
      requiredProps.push(...props);
    }
  });

  return requiredProps;
}

export async function configResolver(args: any, ctx: any) {
  const { cwd } = ctx;
  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    {
      name: 'default',
      alias: 'd',
      type: Boolean,
      description: 'Set this resolver as default',
    },
    {
      name: 'config',
      alias: 'c',
      type: String,
      multiple: true,
      description: 'Add config to resolver: -c key1=value2 -c key2=value2',
    },
    {
      name: 'stack',
      alias: 's',
      type: String,
      description:
        'The name of the stack to add config to, default to default stack',
    },
    help.def,
  ];

  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Edit the resolver config',
      help.getUsageText('config resolver', '<resolver-alias>')
    );
  }

  const resolverAlias = subCommand;

  // TODO: need to get the existing config, should merge not owerwrite
  const configUpdates: any = {};
  if (opt.default) {
    configUpdates[resolverDefaultHeader] = {
      name: resolverAlias,
    };
  }

  if (opt.config) {
    const [configError, configData] = parseResolverConfigFromOpt(opt.config);
    if (configError.length !== 0) {
      return logger.error(
        `${chalk.red(
          'Invalid config'
        )} for resolver ${resolverAlias}: ${configError.join(
          ', '
        )}: format: key=value; ${chalk.green(
          'ymir config resolver ssm -c key1=value1 -c key2=value2'
        )}`
      );
    }
    configUpdates[resolverConfigHeader(resolverAlias)] = {
      alias: resolverAlias,
      ...configData,
    };
  }

  const hasConfigChanges = Object.keys(configUpdates).length !== 0;

  if (!hasConfigChanges) {
    return logger.info(
      `No config changes for resolver ${chalk.green(resolverAlias)}`
    );
  }

  if (configUpdates.DEFAULT_RESOLVER) {
    logger.info(
      `${chalk.green('Setting')} default resolver to ${chalk.blue(
        resolverAlias
      )}`
    );
  }

  const targetStack = opt.stack || 'default';

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [configFileError, configFile] = await stack.get.getConfig(
    ymirPath,
    targetStack
  );

  if (configFileError) {
    return logError(configFileError);
  }

  const [parsed, comments] = trans.parseStackFile(configFile);
  const mergedProps = Object.entries(configUpdates).reduce((acc, cur: any) => {
    const [key, value] = cur;
    const hasProp = Object.prototype.hasOwnProperty.call(parsed, key);
    const org = hasProp ? parsed[key] : {};

    acc[key] = { ...org, ...value };
    return acc;
  }, {});

  const merged = { ...parsed, ...mergedProps };

  const requiredProps = getAllRequiredProps(merged);

  const configData = trans.transpileObjectToStack(
    merged,
    comments,
    requiredProps
  );

  return stack.update.updateConfigFile(ymirPath, targetStack, configData);
  // TODO: log resolver conf changes here too;
}

const configHandlers = {
  file: async (args: any, ctx: any) => configFile(args, ctx),
  resolver: async (args: any, ctx: any) => configResolver(args, ctx),
};

export async function config(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  // TODO: needs a help logger that works with sub commands;
  if (subArgs.includes('--help') || subArgs.includes('-h')) {
    return help.log(
      [help.def],
      'Edit stack config',
      help.getUsageText('config file|resolver')
    );
  }

  const hasHandler = Object.prototype.hasOwnProperty.call(
    configHandlers,
    subCommand
  );

  if (!hasHandler) {
    return logger.error(
      `${chalk.red('Invalid sub command:')} ${subCommand}. '${chalk.green(
        'ymir config'
      )} ${chalk.red(subCommand)}' is not a valid command.`
    );
  }

  return configHandlers[subCommand](subArgs, ctx);
}
