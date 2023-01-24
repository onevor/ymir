import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';

export const formatKey = (key: string) => key.trim().toUpperCase();

export async function isInProject(exitIfNot = false, ctx: any) {
  const { cwd } = ctx;
  const inProject = await helper.projectExists(cwd);
  if (!inProject) {
    console.error('Not in a ymir project');
    if (exitIfNot) {
      return process.exit(1);
    }
    return false;
  }
  return true;
}

export function parseContentFromOpt(opt: any, _ctx: any) {
  const content: any = {};

  if (Object.hasOwnProperty.call(opt, 'path')) {
    content.path = opt.path;
  }

  if (Object.hasOwnProperty.call(opt, 'description')) {
    content.description = opt.description;
  }

  if (Object.hasOwnProperty.call(opt, 'resolver')) {
    content.resolver = opt.resolver;
  }

  if (Object.hasOwnProperty.call(opt, 'required')) {
    content.required = opt.required;
  }

  return content;
}

export function checkForMissingRequiredProps(
  opt,
  required: string[],
  _ctx: any
) {
  const missing = [];
  required.forEach((prop) => {
    if (!Object.hasOwnProperty.call(opt, prop)) {
      missing.push(prop);
    }
  });

  return missing;
}

export function validateRequiredProps(opt: any, required: string[], ctx: any) {
  const missing = checkForMissingRequiredProps(opt, required, ctx);
  if (missing.length === 0) return [true, null];

  return [false, `Missing required properties: ${missing.join(', ')}`];
}

export function parseSubCommand(args: any) {
  const subCommandDef = [{ name: 'command', defaultOption: true }];

  const subMain = commandLineArgs(subCommandDef, {
    stopAtFirstUnknown: true,
    argv: args,
  });

  const subArgs = subMain._unknown || [];
  const subCommand = subMain.command;

  return { subCommand, subArgs };
}
