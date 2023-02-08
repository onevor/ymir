import * as nodePath from 'path';
import * as fs from 'fs/promises';

export {
  projectExists,
  stackExists,
  existsAllFilesInYmirDir,
  findNearestFileTop,
  exists,
} from './exists';
export { writeFile, readFile, readdir } from 'fs/promises';

export async function getCurrentStack(projectPath: string) {
  const path = nodePath.join(projectPath, 'current_stack');
  const content = await fs.readFile(path, 'utf-8');
  // TODO: Parse this better;
  const [stackNameRaw, stackFilePath] = content.split(':');
  const stackName = stackNameRaw.trim().substring(1, stackNameRaw.length - 1);
  return [stackName, nodePath.join(projectPath, stackFilePath.trim())];
}

export async function getCurrentStackName(ymirPath: string) {
  const [name] = await getCurrentStack(ymirPath);
  return name;
}

export async function getAllFileNamesYmirDir(
  ymirPath: string,
  dir: string
): Promise<[string[], string]> {
  const path = nodePath.join(ymirPath, dir);
  const files = await fs.readdir(path);
  return [files, path];
}

export async function getAllFilesInYmirDir(ymirPath: string, dir: string) {
  const [files, path] = await getAllFileNamesYmirDir(ymirPath, dir);
  // TODO: optimize this;
  const filePaths = files.map((file) => nodePath.join(path, file));
  return Promise.all(filePaths.map((path) => fs.readFile(path, 'utf-8')));
}

export async function writeYmirFile(
  ymirPath: string,
  relativePath: string,
  data: string
) {
  const path = nodePath.join(ymirPath, relativePath);
  return fs.writeFile(path, data);
}

export async function writeStack(
  projectPath: string,
  stackName: string,
  data: string
) {
  const path = nodePath.join(projectPath, 'stacks', stackName);
  return fs.writeFile(path, data);
}

export async function getFileFromYmir(ymirPath: string, relativePath: string) {
  const path = nodePath.join(ymirPath, relativePath);
  return fs.readFile(path, 'utf-8');
}

export async function getFileFromYmirDir(
  ymirPath: string,
  dir: string,
  fileName: string
) {
  const path = nodePath.join(ymirPath, dir, fileName);
  return fs.readFile(path, 'utf-8');
}

export async function getStackConfigData(
  projectPath: string,
  stackName: string
) {
  const path = nodePath.join(projectPath, 'stack-config', stackName);
  const content = await fs.readFile(path, 'utf-8');
  return content;
}

export async function getJsonFileAsObject(path: string) {
  const content = await fs.readFile(path, 'utf-8');
  return JSON.parse(content);
}
