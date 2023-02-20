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
import * as fs from '../../lib/config/helper/fs';

import {
  isInProject,
  parseContentFromOpt,
  validateRequiredProps,
  formatKey,
  parseSubCommand,
} from '../lib/index';

import * as help from '../lib/help';

const chalk: any = Chalk;

const commonDef = [
  { name: 'key', alias: 'k', type: String },
  { name: 'path', alias: 'p', type: String },
  { name: 'description', alias: 'd', type: String },
  { name: 'resolver', alias: 'r', type: String },
  { name: 'required', alias: 'q', type: Boolean },
  { name: 'global', alias: 'g', type: Boolean },
  { name: 'stack', alias: 's', type: String },
  help.def,
];

const addDef = [...commonDef];
const updateDef = [...commonDef];
const removeDef = [...commonDef];

type ValidationError = {
  code: string;
  message: string;
};

type ValidationSuccess = {
  cwd: string;
  key: string;
  opt: any;
  ymirPath: string;
};

type ValidationResult = [ValidationError | null, ValidationSuccess | null];

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

  const key = subCommand || opt.key;

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

export async function add(args: any, ctx: any) {
  const [valError, data] = await validateCommand(args, ctx, addDef, 'add');
  if (valError) return console.error(valError.message);

  const { cwd, key, opt, ymirPath } = data;

  if (opt.help) {
    return help.log(
      addDef,
      'Add a new property to a stack',
      help.getUsageText('add', '<key>')
    );
  }

  const [isValid, valMessage] = validateRequiredProps(opt, ['path'], ctx);
  if (!isValid) return console.error(valMessage);

  const [stackError, stackName] = await getStackNameToUse(opt, ymirPath, ctx);

  if (stackError) {
    return console.error(`${stackError.code}: ${stackError.message}`);
  }

  /**
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
