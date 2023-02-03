import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import * as fs from '../../lib/config/helper/fs';
import * as resolverLib from '../../lib/resolve/lib/resolver-operations/resolve-stack';
import * as getPlugin from '../../lib/plugin/get-plugin';
import * as getStack from '../../lib/stack/get';

import { isInProject } from '../lib/index';
import * as help from '../lib/help';

import { entriesToEnvFile } from '../../lib/dotfile';

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

  // const [stack, defaultStack, stackConfig, defaultStackConfig] =
  const stackSource = await getStack.stackSource(ymirPath, stackName);
  const [defaultResolverErr, defaultResolver] =
    getPlugin.defaultResolver(stackSource);

  if (defaultResolverErr) {
    console.error(defaultResolverErr.message, defaultResolverErr);
    return;
  }

  const [resolverConfErr, resolverConf] = await getPlugin.configByStackSource(
    ymirPath,
    stackSource
  );

  if (resolverConfErr) {
    console.error('Unable to create resolver config: ', resolverConfErr);
    return;
  }

  const data = getPlugin.parseFiles(stackSource);

  const resolved = await resolverLib.resolveStack(
    ymirPath,
    data,
    defaultResolver,
    resolverConf
  );

  const dotFileData = entriesToEnvFile(resolved);
  const fileConf = data.stackConfig.FILE || data.defaultStackConfig.FILE;

  if (!fileConf) {
    console.error('No FILE config found in stack or default stack');
    return;
  }

  const filePath = nodePath.join(ymirPath, '../', fileConf.path, fileConf.name);
  return fs.writeFile(filePath, dotFileData);
}
