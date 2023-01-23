import * as nodePath from 'path';
import { access, writeFile } from 'fs/promises';

export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function existsAll(paths: string[]) {
  return Promise.all(paths.map(async (path) => [await exists(path), path]));
}

export async function writeDotFile(path, name, content) {
  const envPath = nodePath.join(path, name);
  return writeFile(envPath, content);
}

export async function writeRc(path, content) {
  const data = JSON.stringify(content, null, 2);
  return writeFile(path, data);
}
