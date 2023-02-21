import * as nodePath from 'path';

import * as fs from '../../../config/helper/fs';
import { execCommand } from '../../../cmd';
import { logger } from '../../../util/logger';

export async function locateNearestPackageJson(cwd: string) {
  return await fs.findNearestFileTop(cwd, 'package.json');
}

export async function locateNearestNodeModules(cwd: string) {
  return await fs.findNearestFileTop(cwd, 'node_modules');
}

export async function getPackageJsonAsObject(pkJsonPath: string) {
  return fs.getJsonFileAsObject(pkJsonPath);
}

export async function checkIfPluginIsInstalledInPackageJson(
  cwd: string,
  pkName: string
) {
  const pkJsonPath = await locateNearestPackageJson(cwd);
  if (!pkJsonPath) {
    return false;
  }
  // TODO: try catch
  const pkJson = await getPackageJsonAsObject(pkJsonPath);

  const hasDep = Object.hasOwnProperty.call(pkJson, 'dependencies');
  const hasDevDep = Object.hasOwnProperty.call(pkJson, 'devDependencies');

  if (!hasDep && !hasDevDep) {
    return false;
  }

  const hasPluginDep =
    hasDep && Object.hasOwnProperty.call(pkJson.dependencies, pkName);
  const hasPluginDevDep =
    hasDevDep && Object.hasOwnProperty.call(pkJson.devDependencies, pkName);

  if (hasPluginDep || hasPluginDevDep) {
    return true;
  }

  return false;
}

export async function locateGlobalNodeModulesPath(): Promise<string> {
  return execCommand('npm root -g').then((str) => str.trim());
}

export async function checkIfPackageIsInstalledInNodeModules(
  pathToNodeModules: string,
  pkName: string
): Promise<[boolean, string]> {
  const pkPath = nodePath.join(pathToNodeModules, pkName);
  const pkExists = await fs.exists(pkPath);
  if (!pkExists) {
    return [false, `Package does not exist at: ${pkPath}`];
  }

  // TODO: check if package is installed, this does not work, not all packages have a node_modules folder;
  // const installedPath = nodePath.join(pkPath, 'node_modules');
  // const installedPathExists = await fs.exists(installedPath);
  // if (!installedPathExists) {
  //   return [false, `Package exists, but is not installed: ${installedPath}`];
  // }

  return [true, ''];
}

export async function locateInstallPathForPk(cwd: string, pkName: string) {
  // check if pk is in nearest pk json;
  const isPkInstalled = await checkIfPluginIsInstalledInPackageJson(
    cwd,
    pkName
  );
  if (isPkInstalled) {
    const nodeModulesPath = await locateNearestNodeModules(cwd);
    if (!nodeModulesPath) {
      logger.error(
        `Pk is installed in project package.json, but unable to locate node_modules folder; please install`
      );
      return;
    }
    const [isInstalled, msg] = await checkIfPackageIsInstalledInNodeModules(
      nodeModulesPath,
      pkName
    );
    if (!isInstalled) {
      logger.error(msg);
      return;
    }
    logger.log('Pk is installed in local project.json');
    return nodePath.join(nodeModulesPath, pkName);
  }
  logger.log(
    `Pk is not installed in local project.json, checking if installed globally`
  );

  const globalNodeModulesPath = await locateGlobalNodeModulesPath();
  if (!globalNodeModulesPath) {
    logger.error(`Unable to locate global node_modules folder`);
    return;
  }
  const [isInstalled, msg] = await checkIfPackageIsInstalledInNodeModules(
    globalNodeModulesPath,
    pkName
  );
  if (!isInstalled) {
    logger.error(msg);
    return;
  }
  logger.log('Pk is globally installed');
  return nodePath.join(globalNodeModulesPath, pkName);
}
