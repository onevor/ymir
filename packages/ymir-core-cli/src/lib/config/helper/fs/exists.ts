import * as nodePath from 'path';
import { exists, existsAll } from '../../../fs';
export { exists } from '../../../fs';

import {
  ymirProjectFolderPath,
  getYmirProjectPath,
  getStackPath,
  getYmirFilePath,
} from '../path';

export async function projectExists(
  cwd: string,
  relativePath?: string,
  absolutePath?: string
) {
  const projectPath = getYmirProjectPath(cwd, relativePath, absolutePath);
  const path = ymirProjectFolderPath(projectPath);
  return exists(path);
}

export async function stackExists(projectPath: string, stackName: string) {
  const path = getStackPath(projectPath, stackName);
  return exists(path);
}

export async function existsAllFilesInYmirDir(
  ymirPath: string,
  dir: string,
  fileNames: string[]
) {
  const paths = fileNames.map((fileName) =>
    getYmirFilePath(ymirPath, dir, fileName)
  );
  return existsAll(paths);
}

export async function findNearestFileTop(
  startPath: string,
  fileName: string,
  maxDepth = 10,
  currentDepth = 0
) {
  const path = nodePath.join(startPath, fileName);
  const exist = await exists(path);
  if (exist) {
    return path;
  }
  if (currentDepth >= maxDepth) {
    return null;
  }
  return findNearestFileTop(
    nodePath.join(startPath, '..'),
    fileName,
    maxDepth,
    currentDepth + 1
  );
}
