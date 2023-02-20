import * as Chalk from 'chalk';
import * as commandLineArgs from 'command-line-args';

import * as initLib from '../../lib/config/init';
import * as helper from '../../lib/config/helper';
import * as coLib from '../../lib/config/stack-operations/checkout';
import { createNewStack } from '../../lib/config/stack-operations/create-stack';
import { removeStack } from '../../lib/config/stack-operations/remove-stack';
import * as reg from '../../lib/plugin/register-plugin';
import plugin from '../../lib/plugin';

import { isInProject, parseSubCommand } from '../lib/index';

import * as help from '../lib/help';

export { add, update, remove } from './edit';

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
    {
      name: 'ignoreExport',
      alias: 'i',
      type: Boolean,
      description: 'Do not export the stack on checkout',
    },
    help.def,
  ];
  const opt = commandLineArgs(def, { argv: subArgs });
  const ymirPath = await helper.ymirProjectFolderPath(cwd);

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

  const stack = subCommand || opt.name;

  if (!stack) {
    console.error(
      `Invalid command: missing stack name to checkout\n\tymir checkout <stack-name>\n\tOR\n\tymir checkout -n [stack-name]`
    );
    return;
  }

  const exists = await helper.stackExists(cwd, stack);

  if (!exists && !opt.create) {
    console.error(`Stack ${stack} does not exist`);
    return;
  }

  if (!exists && opt.create) {
    console.log(`Creating stack ${stack}`);
    await createNewStack(cwd, stack);
  }

  console.log(`Checking out stack ${stack}`);
  await coLib.checkoutStack(cwd, stack);

  if (opt.ignoreExport || opt.create) {
    console.log(`Skipping export of stack ${stack}`);
    return;
  }

  return plugin.export(ymirPath, stack);
}

export async function stack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);
  const def = [
    {
      name: 'current',
      alias: 'c',
      type: Boolean,
      description: 'Only list the current stack',
    },
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

  const currentStackName = chalk.green(opt.current ? name : `* ${name}`);
  const stackRecord = opt.path
    ? `${currentStackName} @(${location})`
    : currentStackName;

  stacks.push(stackRecord);

  if (!opt.current) {
    const [fileNames, path] = await helper.getAllStackFileNames(ymirPath);
    fileNames.forEach((stackName) => {
      if (stackName !== name) {
        stacks.push(opt.path ? `${stackName} @(${path})` : stackName);
      }
    });
  }

  console.log(`\t${stacks.join('\n\t')}`);
  return;
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
