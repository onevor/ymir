import * as nodePath from 'path';

import * as fs from '../config/helper/fs';
import * as resolverLib from '../resolve/lib/resolver-operations/resolve-stack';
import * as getPlugin from '../plugin/get-plugin';
import * as getStack from '../stack/get';

import { entriesToEnvFile } from '../dotfile';
import { logger } from '../util/logger';

export async function _export(ymirPath: string, stackName: string) {
  const stackSource = await getStack.stackSource(ymirPath, stackName);
  const [defaultResolverErr, defaultResolver] =
    getPlugin.defaultResolver(stackSource);

  if (defaultResolverErr) {
    logger.error(defaultResolverErr.message, defaultResolverErr);
    return;
  }

  const [resolverConfErr, resolverConf] = await getPlugin.configByStackSource(
    ymirPath,
    stackSource
  );

  if (resolverConfErr) {
    logger.error('Unable to create resolver config: ', resolverConfErr);
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
    logger.error('No FILE config found in stack or default stack');
    return;
  }

  const filePath = nodePath.join(ymirPath, '../', fileConf.path, fileConf.name);
  return fs.writeFile(filePath, dotFileData);
}
