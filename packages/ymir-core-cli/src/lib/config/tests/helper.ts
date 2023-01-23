import * as fs from 'fs/promises';
import * as nodePath from 'path';

import { exists } from '../../fs';

const ymirFolderName = '.ymir';

export async function setupTestProject(
  initFn: any,
  cwd: string,
  throwOnFail = true
) {
  try {
    await initFn(cwd);
  } catch (error) {
    console.error('Failed to init project', error);
    if (throwOnFail) {
      throw error;
    }
  }

  if (throwOnFail) {
    const ymirPath = nodePath.join(cwd, ymirFolderName);
    const projectExists = await exists(ymirPath);
    if (!projectExists) {
      throw new Error('Init project did not create .ymir folder');
    }
  }
}

export async function teardownTestProject(cwd: string) {
  const ymirPath = nodePath.join(cwd, ymirFolderName);
  const projectExists = await exists(ymirPath);

  if (!projectExists) {
    console.warn('No .ymir folder found to delete');
  }
  // Sanity check
  // No relative delete;
  const isAbsolute = nodePath.isAbsolute(ymirPath);
  if (!isAbsolute) {
    throw new Error('Unable to delete .ymir folder, path is not absolute');
  }
  const levels = ymirPath.split(nodePath.sep);
  if (levels.length < 4) {
    throw new Error('Unable to delete .ymir folder, path is too short');
  }

  try {
    await fs.rm(ymirPath, { recursive: true });
  } catch (error) {
    console.error('Unable to delete .ymir folder', error);
    throw error;
  }
}
