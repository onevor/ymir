import * as trans from '../parser/transpiler';

import {
  getAllFileNamesYmirDir,
  getFileFromYmirDir,
  getStackConfigData,
} from './fs';

export {
  getCurrentStack,
  getAllFileNamesYmirDir,
  getAllFilesInYmirDir,
  writeStack,
  getFileFromYmirDir,
  getStackConfigData,
  projectExists,
  stackExists,
} from './fs';

export {
  ymirProjectFolderPath,
  getYmirProjectPath,
  getStackPath,
  getStackConfigPath,
} from './path';

export async function getAllStackFileNames(
  ymirPath: string
): Promise<[string[], string]> {
  return getAllFileNamesYmirDir(ymirPath, 'stacks');
}

export async function getAllConfigFileNames(
  ymirPath: string
): Promise<[string[], string]> {
  return getAllFileNamesYmirDir(ymirPath, 'stack-config');
}

export async function getStackData(projectPath: string, stackName: string) {
  return getFileFromYmirDir(projectPath, 'stacks', stackName);
}

export async function getParsedStackData(
  projectPath: string,
  stackName: string,
  storeComment = false
) {
  const content = await getStackData(projectPath, stackName);
  return trans.parseStackFile(content, storeComment);
}

export async function getParsedStackConfigData(
  projectPath: string,
  stackName: string,
  storeComment = false
): Promise<[Record<string, any>, Record<string, any>]> {
  const content = await getStackConfigData(projectPath, stackName);
  return trans.parseStackFile(content, storeComment);
}

const defaultProps = ['FILE', 'DEFAULT_RESOLVER'];

export async function getStackDefaultConfig(
  projectPath: string,
  stackName: string
) {
  const [stackConf] = await getParsedStackConfigData(projectPath, stackName);
  const [defaultConf] = await getParsedStackConfigData(projectPath, 'default');

  stackConf.DESCRIBE = defaultConf.DESCRIBE;

  const missingStackProps = [];
  const missingProps = [];

  defaultProps.forEach((prop) => {
    if (!Object.hasOwnProperty.call(stackConf, prop)) {
      missingStackProps.push(prop);
    }
  });

  if (missingStackProps.length !== 0) {
    missingStackProps.forEach((prop) => {
      if (!Object.hasOwnProperty.call(defaultConf, prop)) {
        missingProps.push(prop);
      } else {
        // Missing from stack and default, invalid config;
        stackConf[prop] = defaultConf[prop];
      }
    });
  }

  if (missingProps.length > 0) {
    throw new Error(
      `Invalid config: Missing properties in stack config and default config: ${missingProps.join(
        ', '
      )}`
    );
  }

  return stackConf;
}
