import * as nodePath from 'path';
import * as fs from 'fs/promises';

import { exists } from '../fs';

import { ymirProjectFolderPath, getYmirProjectPath } from './helper';

import * as trans from './parser/transpiler';

type KeyMap = { [key: string]: string };
type ValueMap = { [key: string]: Record<string, any> };

type Override = {
  keyMap: KeyMap;
  valueMap: ValueMap;
};

export function overrideFile(file: string, data: Override) {
  const [dataObject, comments] = trans.parseStackFile(file, true);
  const { keyMap, valueMap } = data;

  const entries = Object.entries(dataObject);
  const updatedData = Object.fromEntries(
    entries.map(([key, value]) => {
      const newKey = keyMap[key] || key;
      const newValue = valueMap[newKey] || value;
      return [newKey, newValue];
    })
  );

  return trans.transpileObjectToStack(updatedData, comments);
}

export async function createFileFromTemplate(
  ymirPath: string,
  relativePath: string,
  templatePath?: string,
  options?: any
) {
  const destinationPath = nodePath.join(ymirPath, relativePath);

  const hasData = options && options.data;
  const override = options && options.override;
  const isEmpty = options && options.empty;
  const needTemplate = templatePath && (!hasData || override) && !isEmpty;

  const templateData = needTemplate
    ? await fs.readFile(templatePath, 'utf-8')
    : '';

  const preData = templateData || options.data || '';

  const data = override ? overrideFile(preData, options.override) : preData;

  return fs.writeFile(destinationPath, data);
}

/**
 * TODO: Refactor the generation to use the new create file function
 */

const ymirRootStructure = [
  (basePath: string, data = '[dev]: ./stacks/dev') => {
    const name = 'current_stack';
    const path = nodePath.join(basePath, name);
    console.log(`Creating file: ${name} at path: ${path}`);
    return fs.writeFile(path, data);
  },
  (basePath: string) => {
    const name = 'stacks';
    const path = nodePath.join(basePath, name);
    console.log(`Creating dir: ${name} at path: ${path}`);
    return fs.mkdir(path);
  },
  (basePath: string) => {
    const name = 'stack-config';
    const path = nodePath.join(basePath, name);
    console.log(`Creating dir: ${name} at path: ${path}`);
    return fs.mkdir(path);
  },
  (basePath: string) => {
    const name = 'plugins';
    const path = nodePath.join(basePath, name);
    console.log(`Creating dir: ${name} at path: ${path}`);
    return fs.mkdir(path);
  },
];

async function createNewFile(basePath: string, name: string, data: string) {
  const path = nodePath.join(basePath, name);
  console.log(`Creating file: ${name} at path: ${path}`);
  return fs.writeFile(path, data);
}

async function createNewFiles(
  basePath: string,
  names: string[],
  data: string[]
) {
  if (names.length !== data.length) {
    throw new Error('names and data must be the same length');
  }

  return Promise.all(
    names.map((name, i) => createNewFile(basePath, name, data[i]))
  );
}

const ymirPluginStructure = [
  (basePath: string, data = 'stuff from rc here') => {
    const name = 'ssm';
    const path = nodePath.join(basePath, name);
    console.log(`Creating file: ${name} at path: ${path}`);
    return fs.writeFile(path, data);
  },
];

export async function createYmirProjectFolder(
  cwd: string,
  relativePath?: string,
  absolutePath?: string
) {
  const projectPath = getYmirProjectPath(cwd, relativePath, absolutePath);
  const path = ymirProjectFolderPath(projectPath);
  const projectExists = await exists(path);

  if (projectExists) {
    throw new Error(`Ymir project already exists at ${path}`);
  }

  return fs.mkdir(path, { recursive: true });
}

async function fetchFile(filePath: string) {
  return fs.readFile(filePath, 'utf8');
}

async function fetchTemplates(dir: string, fileList: string[]) {
  const filePaths = fileList.map((p) => nodePath.join(dir, p));
  return Promise.all(filePaths.map(fetchFile));
}

/**
 * TODO:
 *  - split this up
 *  - Add options
 *   - Use defaults
 */
export async function setupProjectFolder(
  cwd: string,
  relativePath?: string,
  absolutePath?: string
) {
  const projectPath = getYmirProjectPath(cwd, relativePath, absolutePath);
  const path = ymirProjectFolderPath(projectPath);
  const projectExists = await exists(path);

  if (!projectExists) {
    throw new Error(`Ymir project does not exist at ${path}`);
  }

  try {
    await Promise.all(ymirRootStructure.map((fn) => fn(path)));
    const stackFilesPath = nodePath.join(path, 'stacks');
    const stackConfigPath = nodePath.join(path, 'stack-config');
    const defaultStacks = ['default', 'dev', 'stage', 'prod'];
    const templateDir = nodePath.join(__dirname, 'templates');
    const stackTemplateDir = nodePath.join(templateDir, 'stack-files');
    const stackConfigTemplateDir = nodePath.join(templateDir, 'stack-config');

    const stackFiles = await fetchTemplates(stackTemplateDir, defaultStacks);
    // Do not await her so that it can run in the background, until we need it;
    const stackConfigPromises = fetchTemplates(
      stackConfigTemplateDir,
      defaultStacks
    );

    // Do not await her so that it can run in the background, until we need it;
    const stackFileCreatePromises = createNewFiles(
      stackFilesPath,
      defaultStacks,
      stackFiles
    );

    const stackConfig = await stackConfigPromises;
    // TODO: should be able to update data in the template here:
    // Stuff like version, project name ++, like you can do when running npm init;
    const stackConfigCreatePromises = createNewFiles(
      stackConfigPath,
      defaultStacks,
      stackConfig
    );

    // TODO: need to add template data here;
    await Promise.all(
      ymirPluginStructure.map((fn) => fn(nodePath.join(path, 'plugins')))
    );
    await stackFileCreatePromises;
    await stackConfigCreatePromises;
    return;
  } catch (error) {
    // TODO: if it fail, we should clean it up, remove the folder, so that we remove any file created;
    console.error('Unable to set up project folder', error);
    throw error;
  }
}

export async function init(
  cwd: string,
  relativePath?: string,
  absolutePath?: string
) {
  const projectPath = getYmirProjectPath(cwd, relativePath, absolutePath);
  const path = ymirProjectFolderPath(projectPath);
  const projectExists = await exists(path);

  if (projectExists) {
    throw new Error(`Ymir config already exists at ${path}`);
  }

  console.log(`Creating Ymir project dir at ${path}...`);
  await createYmirProjectFolder(cwd, relativePath, absolutePath);
  console.log(`Setting up Ymir project dir at ${path}...`);
  await setupProjectFolder(cwd, relativePath, absolutePath);

  return;
}
