import * as Chalk from 'chalk';
import * as commandLineArgs from 'command-line-args';

import * as initLib from '../../lib/config/init';
import * as helper from '../../lib/config/helper';
import * as coLib from '../../lib/config/stack-operations/checkout';
import { createNewStack } from '../../lib/config/stack-operations/create-stack';
import { removeStack } from '../../lib/config/stack-operations/remove-stack';
import * as edit from '../../lib/config/stack-operations/edit-stack-file';
import * as reg from '../../lib/plugin/register-plugin';
import plugin from '../../lib/plugin';
import stack from '../../lib/stack';
import { YmirError } from '../../lib/types/response';
import * as logger from '../../lib/util/logger';
import * as fs from '../../lib/config/helper/fs';

import {
  isInProject,
  parseContentFromOpt,
  validateRequiredProps,
  formatKey,
  parseSubCommand,
} from '../lib/index';

import * as help from '../lib/help';
import { StackSource } from '../../lib/types/stack';

const chalk: any = Chalk;

const commonDef = [
  { name: 'key', alias: 'k', type: String },
  { name: 'path', alias: 'p', type: String },
  { name: 'description', alias: 'd', type: String },
  { name: 'resolver', alias: 'r', type: String },
  { name: 'required', alias: 'q', type: Boolean },
  { name: 'global', alias: 'g', type: Boolean },
  { name: 'stack', alias: 's', type: String },
  { name: 'value', alias: 'v', type: String },
  help.def,
];

const addDef = [...commonDef];
const updateDef = [...commonDef];
const removeDef = [...commonDef];

type ValidationSuccess = {
  cwd: string;
  key: string;
  opt: any;
  ymirPath: string;
};

type ValidationResult = [YmirError | null, ValidationSuccess | null];

async function validateCommand(
  args: any,
  ctx: any,
  def: any,
  command: string
): Promise<ValidationResult> {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  const opt = commandLineArgs(def, { argv: subArgs });

  if (!opt.help && opt.key && subCommand) {
    console.warn(
      `Provided two keys, ignoring ${opt.key}, and using ${subCommand}\n\tymir ${command} <key>\n\tOR\n\tymir ${command} -k [key]\n\n\tDo not combine the two`
    );
  }

  const key = (subCommand || opt.key).toUpperCase();

  if (!key) {
    const msg = `Invalid command: missing property "key"\n\tymir ${command} <key>\n\tOR\n\tymir ${command} -k [key]`;
    return [
      {
        code: 'INVALID_COMMAND',
        message: msg,
      },
      null,
    ];
  }

  return [
    null,
    {
      cwd,
      key,
      opt,
      ymirPath: helper.ymirProjectFolderPath(cwd),
    },
  ];
}

function determineStack(opt: any, ctx: any) {
  if (opt.stack) return opt.stack;
  if (opt.global) return 'default';
  return null;
}

async function validateStack(stackName: string, ctx: any) {
  // check that stack exists
  return fs.stackExists(ctx.cwd, stackName);
}

async function getCurrentStack(ymirPath: string, ctx: any) {
  // get current stack
  return fs.getCurrentStackName(ymirPath);
}

async function getStackNameToUse(opt: any, ymirPath: string, ctx: any) {
  const optStack = determineStack(opt, ctx);
  if (optStack) {
    const isValid = await validateStack(optStack, ctx);
    if (!isValid) {
      return [
        {
          code: 'STACK_NOT_FOUND',
          message: `Stack ${optStack} does not exist`,
        },
        null,
      ];
    }
    return [null, optStack];
  }

  const currentStack = await getCurrentStack(ymirPath, ctx);
  // if error or falsy return error;
  return [null, currentStack];
}

async function getResolverAliasToUse(
  opt: any,
  stackSource: StackSource,
  ymirPath: string
) {
  const optResolver = opt.resolver;
  if (optResolver) {
    const [optError, validOpt] = await plugin.val.byAlias(
      ymirPath,
      optResolver
    );
    return [optError, optResolver];
  }

  const [defaultError, defaultResolver] = await plugin.get.defaultResolver(
    stackSource
  );
  if (defaultError) return [defaultError, null];

  /**
   * Over kill to validate her, should be validated before this;
   * TODO: [RESOLVE_PLUGIN] if invalid here we should try to resolve plugins again
   */
  const [defaultValError, valDefault] = await plugin.val.byAlias(
    ymirPath,
    defaultResolver
  );

  return [defaultValError, defaultResolver];
}

async function getResolverToUse(
  opt: any,
  stackSource: StackSource,
  ymirPath: string
) {
  const [resolverAliasError, resolverAlias] = await getResolverAliasToUse(
    opt,
    stackSource,
    ymirPath
  );

  if (resolverAliasError) {
    return [resolverAliasError, null];
  }

  console.log(
    `${chalk.green('Using')} resolver: "${chalk.blueBright(resolverAlias)}"`
  );

  const [resolverConfErr, resolverConf] = await plugin.get.configByAlias(
    ymirPath,
    stackSource,
    resolverAlias
  );

  if (resolverConfErr) return [resolverConfErr, null];

  const hasConfig = Object.prototype.hasOwnProperty.call(
    resolverConf,
    resolverAlias
  );

  if (!hasConfig) {
    return [
      {
        code: 'RESOLVER_CONFIG_NOT_FOUND',
        message: `Resolver config not found for ${resolverAlias}`,
      },
      null,
    ];
  }

  const config = resolverConf[resolverAlias];

  const [pluginError, plug] = await plugin.dynamicImport.byAlias(
    ymirPath,
    resolverAlias
  );

  if (pluginError) {
    return [pluginError, null];
  }

  return [
    null,
    {
      plug,
      config,
      alias: resolverAlias,
    },
  ];
}

export async function add(args: any, ctx: any) {
  const [valError, data] = await validateCommand(args, ctx, addDef, 'add');
  if (valError) return console.error(valError.message);

  const { key, opt, ymirPath } = data;

  if (opt.help) {
    return help.log(
      addDef,
      'Add a new property to a stack',
      help.getUsageText('add', '<key>')
    );
  }

  const [stackError, stackName] = await getStackNameToUse(opt, ymirPath, ctx);

  if (stackError) {
    return logger.logError(stackError);
  }

  console.log(
    `${chalk.green('Adding')} new property to stack: "${chalk.blueBright(
      stackName
    )}"`
  );

  const stackSource = await stack.get.stackSource(ymirPath, stackName);
  const [resolverError, resolver] = await getResolverToUse(
    opt,
    stackSource,
    ymirPath
  );

  if (resolverError) return logger.logError(resolverError);

  // TODO: should be able to use path from opt;
  const path = resolver.plug.createPathFromKeyAndStackName(key, stackName);

  console.log(
    `${chalk.green('New')} property path: "${chalk.blueBright(
      key
    )}" ${chalk.green.bold('->')} "${chalk.blueBright(path)}"`
  );

  const prop = {
    path,
    key,
    value: opt.value,
  };

  const [addError, addResult] = await plugin.edit.add(
    resolver.plug,
    prop,
    resolver.config
  );

  if (addError) return logger.logError(addError);

  console.log(
    `${chalk.green('Added')} new property: "${chalk.blueBright(
      key
    )}" to external secret store.`
  );

  const [updateError, updateResult] = await stack.update.addNewProperty(
    ymirPath,
    stackName,
    {
      key,
      path,
      resolver: resolver.alias,
    }
  );

  if (updateError) return logger.logError(updateError);

  console.log(
    `${chalk.green('Updated')} stack: "${chalk.blueBright(stackName)}"`
  );

  return;
}

export async function remove(args: any, ctx: any) {
  /**
   * Validate
   * help
   *
   * Resolver method
   *
   * Update stack
   */
}

export async function update(args: any, ctx: any) {
  /**
   * Validate
   * help
   *
   * Resolver method
   *
   * Update stack
   */
}
