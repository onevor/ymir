import * as commandLineArgs from 'command-line-args';

import * as initLib from '../../lib/config/init';
import * as helper from '../../lib/config/helper';
import * as coLib from '../../lib/config/stack-operations/checkout';
import { createNewStack } from '../../lib/config/stack-operations/create-stack';
import { removeStack } from '../../lib/config/stack-operations/remove-stack';
import * as edit from '../../lib/config/stack-operations/edit-stack-file';

import {
  isInProject,
  parseContentFromOpt,
  validateRequiredProps,
  formatKey,
} from '../lib/index';

export async function init(args: any, ctx: any) {
  const { cwd } = ctx;
  const def = [
    { name: 'relativePath', alias: 'p', type: String },
    { name: 'absolutePath', alias: 'f', type: String },
  ];
  const opt = commandLineArgs(def, { argv: args });

  return initLib.init(cwd, opt.relativePath, opt.absolutePath);
}

export async function checkoutStack(args: any, ctx: any) {
  const { cwd } = ctx;
  const inProject = await helper.projectExists(cwd);
  if (!inProject) {
    console.error('Not in a ymir project');
    return;
  }
  const subCommandDef = [{ name: 'command', defaultOption: true }];

  const subMain = commandLineArgs(subCommandDef, {
    stopAtFirstUnknown: true,
    argv: args,
  });

  const subArgs = subMain._unknown || [];
  const nameCommand = subMain.command;

  /**
   * TODO: options to copy data from existing stack on create
   */
  const def = [
    { name: 'name', alias: 'n', type: String },
    { name: 'create', alias: 'c', type: Boolean },
  ];
  const opt = commandLineArgs(def, { argv: subArgs });

  if (opt.name && nameCommand) {
    console.warn(
      `Provided two names for checkout, ignoring ${opt.name}, and using ${nameCommand}\n\tymir checkout <stack-name>\n\tOR\n\tymir checkout -n [stack-name]\n\n\tDo not combine the two`
    );
  }

  const name = nameCommand || opt.name;

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
    { name: 'list', alias: 'l', type: Boolean },
    { name: 'path', alias: 'p', type: Boolean },
  ];
  const opt = commandLineArgs(def, { argv: args });

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
  const def = [
    { name: 'key', alias: 'k', type: String },
    { name: 'path', alias: 'p', type: String },
    { name: 'description', alias: 'd', type: String },
    { name: 'resolver', alias: 'r', type: String },
    { name: 'required', alias: 'q', type: Boolean },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'stack', alias: 's', type: String },
  ];
  const opt = commandLineArgs(def, { argv: args });

  const [isValid, valMessage] = validateRequiredProps(
    opt,
    ['key', 'path'],
    ctx
  );

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const prop: any = {
    key: formatKey(opt.key),
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
  const def = [
    { name: 'key', alias: 'k', type: String },
    { name: 'path', alias: 'p', type: String },
    { name: 'description', alias: 'd', type: String },
    { name: 'resolver', alias: 'r', type: String },
    { name: 'required', alias: 'q', type: Boolean },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'stack', alias: 's', type: String },
  ];
  const opt = commandLineArgs(def, { argv: args });

  const [isValid, valMessage] = validateRequiredProps(
    opt,
    ['key', 'path'],
    ctx
  );
  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const prop: any = {
    key: formatKey(opt.key),
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
  const def = [
    { name: 'key', alias: 'k', type: String },
    { name: 'global', alias: 'g', type: Boolean },
    { name: 'stack', alias: 's', type: String },
  ];
  const opt = commandLineArgs(def, { argv: args });

  const [isValid, valMessage] = validateRequiredProps(opt, ['key'], ctx);

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const prop: any = {
    key: formatKey(opt.key),
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
  const def = [{ name: 'name', alias: 'n', type: String }];
  const opt = commandLineArgs(def, { argv: args });

  const { name } = opt;

  const [isValid, valMessage] = validateRequiredProps(opt, ['name'], ctx);

  if (!isValid) {
    console.error(valMessage);
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
  const def = [
    { name: 'name', alias: 'n', type: String },
    { name: 'force', alias: 'f', type: Boolean },
    { name: 'checkout', alias: 'c', type: String },
  ];
  const opt = commandLineArgs(def, { argv: args });

  const [isValid, valMessage] = validateRequiredProps(opt, ['name'], ctx);

  if (!isValid) {
    console.error(valMessage);
    return;
  }

  const { name } = opt;

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
