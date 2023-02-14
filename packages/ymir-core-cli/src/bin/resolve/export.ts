import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import * as fs from '../../lib/config/helper/fs';
import plugin from '../../lib/plugin';

import { isInProject } from '../lib/index';
import * as help from '../lib/help';

export async function exportStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [{ name: 'stack', alias: 's', type: String }, help.def];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Export a stack to a .env file');
  }

  const ymirPath = await helper.ymirProjectFolderPath(cwd);
  const stackName = opt.stack || (await fs.getCurrentStackName(ymirPath));
  const stackExists = await fs.stackExists(cwd, stackName);

  if (!stackExists) {
    console.error(`Stack ${stackName} does not exist`);
    return;
  }

  return plugin.export(ymirPath, stackName);
}
