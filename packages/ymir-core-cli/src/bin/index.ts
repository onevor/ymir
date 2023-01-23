#!/usr/bin/env node
import * as commandLineArgs from 'command-line-args';

import {
  init,
  checkoutStack,
  stack,
  add,
  update,
  remove,
  create,
  deleteStack,
} from './stack-operation';
import { install } from './plugin-operation';
import { exportStack } from './resolve';

const cwd = process.cwd();

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const mainOptions = commandLineArgs(mainDefinitions, {
  stopAtFirstUnknown: true,
});
const argv = mainOptions._unknown || [];

/**
 * Commands to add
 * - ls all plugins
 * - get plugin info
 * - validate that a plugin is installed correctly
 */

const commands = {
  init: (args: any, ctx: any) => init(args, ctx),
  checkout: (args: any, ctx: any) => checkoutStack(args, ctx),
  stack: (args: any, ctx: any) => stack(args, ctx),
  add: (args: any, ctx: any) => add(args, ctx),
  update: (args: any, ctx: any) => update(args, ctx),
  remove: (args: any, ctx: any) => remove(args, ctx),
  create: (args: any, ctx: any) => create(args, ctx),
  delete: (args: any, ctx: any) => deleteStack(args, ctx),
  install: (args: any, ctx: any) => install(args, ctx),
  export: (args: any, ctx: any) => exportStack(args, ctx),
};

async function main() {
  const ctx = {
    cwd,
    mainOptions,
  };
  if (!Object.hasOwnProperty.call(commands, mainOptions.command)) {
    console.error(`"${mainOptions.command}" is not a valid command`);
  }
  return commands[mainOptions.command](argv, ctx);
}

main();
