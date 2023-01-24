import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';

import * as helper from '../../lib/config/helper';
import * as fs from '../../lib/config/helper/fs';
import * as trans from '../../lib/config/parser/transpiler';
import * as check from '../../lib/resolve/check-install';
import * as resolverLib from '../../lib/resolve/lib/resolver-operations/resolve-stack';

import { isInProject } from '../lib/index';
import * as help from '../lib/help';

import { entriesToEnvFile } from '../../lib/dotfile';

export async function exportStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [{ name: 'stack', alias: 's', type: String }, help.def];
  const opt = commandLineArgs(def, { argv: args });

  const ymirPath = await helper.ymirProjectFolderPath(cwd);

  const stackName = opt.stack || (await fs.getCurrentStackName(ymirPath));
  console.log(stackName);
  const stackExists = await fs.stackExists(cwd, stackName);

  if (!stackExists) {
    console.error(`Stack ${stackName} does not exist`);
    return;
  }

  const stackRelativePath = nodePath.join('stacks', stackName);
  const defaultStackRelativePath = nodePath.join('stacks', 'default');
  const stackConfRelativePath = nodePath.join('stack-config', stackName);
  const defaultStackConfRelativePath = nodePath.join('stack-config', 'default');

  console.log('Fetching stack and default stack data');
  const stackPromise = fs.getFileFromYmir(ymirPath, stackRelativePath);
  const defaultStackPromise = fs.getFileFromYmir(
    ymirPath,
    defaultStackRelativePath
  );

  console.log('Fetching config for stack and default stack');
  const stackConfPromise = fs.getFileFromYmir(ymirPath, stackConfRelativePath);
  const defaultStackConfPromise = fs.getFileFromYmir(
    ymirPath,
    defaultStackConfRelativePath
  );

  const stacks = await Promise.all([stackPromise, defaultStackPromise]);
  const stackConf = await Promise.all([
    stackConfPromise,
    defaultStackConfPromise,
  ]);

  const defaultResolver =
    check.getDefaultResolverAliasFromConfig(stackConf[0]) ||
    check.getDefaultResolverAliasFromConfig(stackConf[1]);

  if (!defaultResolver) {
    console.error('No default resolver found in config files');
    return;
  }

  const allResolvers = await check.getAllResolverNamesFromStackAndConfigFiles(
    stackConf,
    stacks
  );

  console.log('Resolvers to load: ', allResolvers);
  const [pluginsExistsError, pluginExists] = await check.validatePluginsExist(
    ymirPath,
    allResolvers
  );

  if (pluginsExistsError) {
    console.error('Unable to validate resolvers: ', pluginsExistsError);
    return;
  }

  const [pathMapError, pathMap] = await check.getPluginPathsMap(
    ymirPath,
    allResolvers
  );

  if (pathMapError) {
    console.error('Error: ', pathMapError);
    console.log('Valid paths: ', pathMap);
    return;
  }

  console.log('Validating resolvers...');
  const [pathExistsError, pathExists] = await check.validatePathMap(
    ymirPath,
    pathMap
  );

  if (pathExistsError) {
    console.error('Unable to validate resolver configs: ', pathExistsError);
    return;
  }

  console.log('Got resolver map: ', pathMap);
  console.log('Resolving stack...');
  const stackObject = trans.parseStackFile(stacks[0])[0];
  const defaultStackObject = trans.parseStackFile(stacks[1])[0];
  const stackConfigObject = trans.parseStackFile(stackConf[0])[0];
  const defaultStackConfigObject = trans.parseStackFile(stackConf[1])[0];

  const resolved = await resolverLib.resolveStack(
    ymirPath,
    stackObject,
    defaultStackObject,
    defaultResolver,
    pathMap
  );

  // create .env file based on def in stack or default;

  console.log(`Exporting stack ${stackName}...`);

  const dotFileData = entriesToEnvFile(resolved);
  const fileConf = stackConfigObject.FILE || defaultStackConfigObject.FILE;

  if (!fileConf) {
    console.error('No FILE config found in stack or default stack');
    return;
  }

  const filePath = nodePath.join(ymirPath, '../', fileConf.path, fileConf.name);
  return fs.writeFile(filePath, dotFileData);
}
