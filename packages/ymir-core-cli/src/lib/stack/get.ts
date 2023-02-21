/**
 * Helper to get and parse stack files
 *
 * This is now done in many different ways all over the place.
 * Need to centralize and standardize this here.
 */
import * as nodePath from 'path';

import * as StackT from '../types/stack';
import * as fs from '../config/helper/fs';
import * as trans from '../config/parser/transpiler';
import { logger } from '../util/logger';

export const getStackFilePath = (
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName
) => nodePath.join(ymirPath, 'stacks', stackName);

export async function stackFile(
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName
) {
  const path = nodePath.join(ymirPath, 'stacks', stackName);
  return fs.readFile(path, 'utf-8');
}

export async function stackConfigFile(
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName
) {
  const path = nodePath.join(ymirPath, 'stack-config', stackName);
  return fs.readFile(path, 'utf-8');
}

export async function parsedStack(
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName,
  storeComments = false
) {
  const stackData = await stackFile(ymirPath, stackName);
  return trans.parseStackFile(stackData, storeComments);
}

export async function parsedConfig(
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName,
  storeComments = false
) {
  const stackData = await stackConfigFile(ymirPath, stackName);
  return trans.parseStackFile(stackData, storeComments);
}

export async function getMainAndDefault(
  ymirPath: StackT.YmirPath,
  mainFilePath: StackT.YmirRelativePath,
  defaultFilePath: StackT.YmirRelativePath
): Promise<any> {
  // TODO: I can return the promise here to speed things up.
  try {
    const mainData = await fs.getFileFromYmir(ymirPath, mainFilePath);
    const defaultData = await fs.getFileFromYmir(ymirPath, defaultFilePath);
    return [null, [mainData, defaultData]];
  } catch (error) {
    logger.error('Error getting main and default files', error);
    return [
      {
        code: 'ERROR_GETTING_MAIN_AND_DEFAULT_FILES',
        message: 'Error getting main and default files',
      },
      null,
    ];
  }
}

export function getRelativePaths(
  stackName: StackT.StackName
): StackT.StackSourcePaths {
  const stackDir = 'stacks';
  const stackConfigDir = 'stack-config';
  const defaultFileName = 'default';

  return {
    stack: nodePath.join(stackDir, stackName),
    defaultStack: nodePath.join(stackDir, defaultFileName),
    stackConfig: nodePath.join(stackConfigDir, stackName),
    defaultStackConfig: nodePath.join(stackConfigDir, defaultFileName),
  };
}

export async function stackSource(
  ymirPath: StackT.YmirPath,
  stackName: StackT.StackName
): Promise<StackT.StackSource> {
  const relPaths = getRelativePaths(stackName);
  const [stackErr, [stack, defaultStack]] = await getMainAndDefault(
    ymirPath,
    relPaths.stack,
    relPaths.defaultStack
  );
  if (stackErr) return stackErr;

  const [configErr, [stackConfig, defaultStackConfig]] =
    await getMainAndDefault(
      ymirPath,
      relPaths.stackConfig,
      relPaths.defaultStackConfig
    );
  if (configErr) throw configErr;

  return { stack, defaultStack, stackConfig, defaultStackConfig };
}

export async function currentStack(
  ymirPath: StackT.YmirPath
): Promise<[any, string | null]> {
  try {
    const currentData = await fs.readFile(
      nodePath.join(ymirPath, 'current_stack'),
      'utf8'
    );
    // TODO: Parse this better;
    const [stackNameRaw] = currentData.split(':');
    const stackName = stackNameRaw.trim().substring(1, stackNameRaw.length - 1);
    return [null, stackName];
  } catch (error) {
    return [
      {
        code: 'ERROR_GETTING_CURRENT_STACK',
        message: 'Unable to get current stack',
        orgError: error,
      },
      null,
    ];
  }
}
