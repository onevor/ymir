import * as Chalk from 'chalk';
import * as commandLineArgs from 'command-line-args';

import * as initLib from '../../lib/config/init';
import * as helper from '../../lib/config/helper';
import * as coLib from '../../lib/config/stack-operations/checkout';
import { createNewStack } from '../../lib/config/stack-operations/create-stack';
import { removeStack } from '../../lib/config/stack-operations/remove-stack';
import * as edit from '../../lib/config/stack-operations/edit-stack-file';
import * as reg from '../../lib/plugin/register-plugin';

import {
  isInProject,
  parseContentFromOpt,
  validateRequiredProps,
  formatKey,
  parseSubCommand,
} from '../lib/index';

import * as help from '../lib/help';

const chalk: any = Chalk;

/**
 * TODO:
 * - a lot of the def is the same, should have one def for props that are equal
 * - Need to have consistent descriptions, for help;
 */

export async function init(args: any, ctx: any) {
  const { cwd } = ctx;
  const def = [
    { name: 'relativePath', alias: 'p', type: String },
    { name: 'absolutePath', alias: 'f', type: String },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Init a new ymir project');
  }

  await initLib.init(cwd, opt.relativePath, opt.absolutePath);

  console.log(`New ymir project created at ${chalk.green(cwd)}`);

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const pluginPaths = await reg.fullPluginResolve(cwd);

  if (pluginPaths.length === 0) {
    console.warn(chalk.red('Unable to locate any plugins to install'));
    return;
  }

  console.log(
    `\nFound ${chalk.green(
      pluginPaths.length
    )} plugins to install:\n\t${chalk.green(pluginPaths.join('\n\t'))}`
  );

  const resolved = await reg.registerPlugins(ymirPath, pluginPaths);

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
  return;
}

export async function checkoutStack(args: any, ctx: any) {
  const { cwd } = ctx;
  const inProject = await helper.projectExists(cwd);
  if (!inProject) {
    console.error('Not in a ymir project');
    return;
  }
  // TODO: add helper here too?
  const { subCommand, subArgs } = parseSubCommand(args);

  /**
   * TODO: options to copy data from existing stack on create
   */
  const def = [
    {
      name: 'name',
      alias: 'n',
      type: String,
      description: 'Alias for name to check out',
    },
    {
      name: 'create',
      alias: 'c',
      type: Boolean,
      description: 'Create a new stack',
    },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Checkout a stack',
      help.getUsageText('checkout', '<stack-name>')
    );
  }

  if (opt.name && subCommand) {
    console.warn(
      `Provided two names for checkout, ignoring ${opt.name}, and using ${subCommand}\n\tymir checkout <stack-name>\n\tOR\n\tymir checkout -n [stack-name]\n\n\tDo not combine the two`
    );
  }

  const name = subCommand || opt.name;

  if (!name) {
    console.error(
      `Invalid command: missing stack name to checkout\n\tymir checkout <stack-name>\n\tOR\n\tymir checkout -n [stack-name]`
    );
    return;
  }

  const exists = await helper.stackExists(cwd, name);

  if (!exists && !opt.create) {
    console.error(`Stack ${name} does not exist`);
    return;
  }

  if (!exists && opt.create) {
    console.log(`Creating stack ${name}`);
    await createNewStack(cwd, name);
  }

  console.log(`Checking out stack ${name}`);
  return coLib.checkoutStack(cwd, name);
}

export async function stack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [
    { name: 'list', alias: 'l', type: Boolean, description: 'List all stacks' },
    {
      name: 'path',
      alias: 'p',
      type: Boolean,
      description: 'Show file path to stack',
    },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Get information about stack(s)');
  }

  const stacks = [];

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [name, location] = await helper.getCurrentStack(ymirPath);

  const currentStackName = opt.list ? `* ${name}` : name;
  const stackRecord = opt.path
    ? `${currentStackName} @(${location})`
    : currentStackName;

  stacks.push(stackRecord);

  if (opt.list) {
    const [fileNames, path] = await helper.getAllStackFileNames(ymirPath);
    fileNames.forEach((stackName) => {
      if (stackName !== name) {
        stacks.push(opt.path ? `${stackName} @(${path})` : stackName);
      }
    });
  }

  if (opt.list) {
    console.log(`Stacks:\n\t${stacks.join('\n\t')}`);
    return;
  }
  console.log(`Current stack:\n\t${stacks.join('\n\t')}`);
  return;
}

export async function add(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    {
      name: 'key',
      alias: 'k',
      type: String,
      description: 'The name of the parameter to add',
    },
    {
      name: 'path',
      alias: 'p',
      type: String,
      description: 'The path the resolver should use to fetch the value',
    },
    { name: 'description', alias: 'd', type: String },
    {
      name: 'resolver',
      alias: 'r',
      type: String,
      description: 'The alias name for the resolver',
    },
    { name: 'required', alias: 'q', type: Boolean },
    {
      name: 'global',
      alias: 'g',
      type: Boolean,
      description: 'Add to the default stack',
    },
    {
      name: 'stack',
      alias: 's',
      type: String,
      description: 'Add to a specific stack, other then the checked out stack',
    },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Add a new property to a stack',
      help.getUsageText('add', '<key>')
    );
  }

  if (opt.key && subCommand) {
    console.warn(
      `Provided two keys to add, ignoring ${opt.key}, and using ${subCommand}\n\tymir add <key>\n\tOR\n\tymir add -k [key]\n\n\tDo not combine the two`
    );
  }

  const [isValid, valMessage] = validateRequiredProps(opt, ['path'], ctx);

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const key = subCommand || opt.key;

  if (!key) {
    console.error(
      `Invalid command: missing property key to add\n\tymir add <key>\n\tOR\n\tymir add -k [key]`
    );
    return;
  }

  const prop: any = {
    key: formatKey(key),
  };

  const options = {
    globalStack: opt.global || false,
    destinationStack: opt.stack || null,
  };

  // TODO: if stack check that it exists;
  prop.content = { ...parseContentFromOpt(opt, ctx) };
  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [currentStack] = await helper.getCurrentStack(ymirPath);
  return edit.addNewProperty(currentStack, ymirPath, prop, options);
}

export async function update(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    { name: 'key', alias: 'k', type: String },
    { name: 'path', alias: 'p', type: String },
    { name: 'description', alias: 'd', type: String },
    { name: 'resolver', alias: 'r', type: String },
    { name: 'required', alias: 'q', type: Boolean },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'stack', alias: 's', type: String },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Update a property in a stack',
      help.getUsageText('update', '<key>')
    );
  }

  if (opt.key && subCommand) {
    console.warn(
      `Provided two keys to update, ignoring ${opt.key}, and using ${subCommand}\n\tymir update <key>\n\tOR\n\tymir update -k [key]\n\n\tDo not combine the two`
    );
  }

  const [isValid, valMessage] = validateRequiredProps(opt, ['path'], ctx);
  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const key = subCommand || opt.key;

  if (!key) {
    console.error(
      `Invalid command: missing property key to update\n\tymir update <key>\n\tOR\n\tymir update -k [key]`
    );
    return;
  }

  const prop: any = {
    key: formatKey(key),
  };

  prop.content = { ...parseContentFromOpt(opt, ctx) };

  const options = {
    globalStack: opt.global || false,
    destinationStack: opt.stack || null,
  };

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [currentStack] = await helper.getCurrentStack(ymirPath);

  return edit.updateProperty(currentStack, ymirPath, prop, options);
}

export async function remove(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    { name: 'key', alias: 'k', type: String },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'stack', alias: 's', type: String },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Remove a property from a stack',
      help.getUsageText('remove', '<key>')
    );
  }

  if (opt.key && subCommand) {
    console.warn(
      `Provided two keys to remove, ignoring ${opt.key}, and using ${subCommand}\n\tymir remove <key>\n\tOR\n\tymir remove -k [key]\n\n\tDo not combine the two`
    );
  }

  const key = subCommand || opt.key;

  if (!key) {
    console.error(
      `Invalid command: missing property key to remove\n\tymir remove <key>\n\tOR\n\tymir remove -k [key]`
    );
    return;
  }

  const prop: any = {
    key: formatKey(key),
  };

  // prop.content = { ...parseContentFromOpt(opt, ctx) };

  const options = {
    globalStack: opt.global || false,
    destinationStack: opt.stack || null,
  };

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [currentStack] = await helper.getCurrentStack(ymirPath);

  return edit.removeProperty(currentStack, ymirPath, prop, options);
}

export async function create(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [{ name: 'name', alias: 'n', type: String }, help.def];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Create a new stack',
      help.getUsageText('create', '<stack-name>')
    );
  }

  if (opt.name && subCommand) {
    console.warn(
      `Provided two names, ignoring ${opt.name}, and using ${subCommand}\n\tymir create <stack-name>\n\tOR\n\tymir create -n [stack-name]\n\n\tDo not combine the two`
    );
  }

  const name = subCommand || opt.name;

  if (!name) {
    console.error(
      `Invalid command: missing stack name to create\n\tymir create <stack-name>\n\tOR\n\tymir create -n [stack-name]`
    );
    return;
  }

  const exists = await helper.stackExists(cwd, name);

  if (exists) {
    console.error(`Stack "${name}" does already exist`);
    return;
  }

  return createNewStack(cwd, name);
}

export async function deleteStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const { subCommand, subArgs } = parseSubCommand(args);

  const def = [
    { name: 'name', alias: 'n', type: String },
    { name: 'force', alias: 'f', type: Boolean },
    { name: 'checkout', alias: 'c', type: String },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.help) {
    return help.log(
      def,
      'Delete a stack',
      help.getUsageText('delete', '<stack-name>')
    );
  }

  if (opt.name && subCommand) {
    console.warn(
      `Provided two names for delete, ignoring ${opt.name}, and using ${subCommand}\n\tymir delete <stack-name>\n\tOR\n\tymir delete -n [stack-name]\n\n\tDo not combine the two`
    );
  }

  const name = subCommand || opt.name;

  if (!name) {
    console.error(
      `Invalid command: missing stack name to delete\n\tymir delete <stack-name>\n\tOR\n\tymir delete -n [stack-name]`
    );
    return;
  }

  if (name === 'default') {
    console.error('Can not delete the default stack');
    return;
  }

  const exists = await helper.stackExists(cwd, name);

  if (!exists) {
    console.error(`Stack "${name}" does not exist`);
    return;
  }

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [currentStack] = await helper.getCurrentStack(ymirPath);

  const delCurrentStack = currentStack === name;

  if (!delCurrentStack) {
    return removeStack(cwd, name);
  }

  if (!opt.force) {
    console.warn(
      `Can not delete the current checkout stack: "${name}"\n\t need to use: (--force|-f) \n\t ymir delete \n\t\t--name|-n [name] \n\t\t--force|-f \n\t\t--checkout|-c [name of branch to checkout]`
    );
    return;
  }
  const checkout = opt.checkout || 'default';
  const coExists = await helper.stackExists(cwd, checkout);
  if (!coExists) {
    console.error(
      `Can not delete current stack, the selected checkout stack "${checkout}" does not exist:\n\tNeed to add a checkout stack (--checkout|-c)\n\tymir delete \n\t\t--name|-n [name] \n\t\t--force|-f \n\t\t--checkout|-c [name of branch to checkout]`
    );
    return;
  }
  console.log(
    `Checking out stack: "${checkout}", before deleting current stack: "${name}"`
  );
  await checkoutStack(cwd, checkout);
  return removeStack(cwd, name);
}
