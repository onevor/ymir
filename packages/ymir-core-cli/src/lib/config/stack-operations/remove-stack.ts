import * as fs from 'fs/promises';

import * as helper from '../helper';

/**
 * TODO:
 * - if deleting current stack, checkout a default?
 */

export async function removeStack(
  projectPath: string,
  name: string,
  options?: any
) {
  const projectExists = await helper.projectExists(projectPath);

  if (!projectExists) {
    throw new Error(`Project does not exist at path: ${projectPath}`);
  }

  const stackExists = await helper.stackExists(projectPath, name);

  if (!stackExists) {
    throw new Error(`Stack ${name} does not exist`);
  }

  const stackPath = helper.getStackPath(projectPath, name);
  await fs.unlink(stackPath);
  return;
}
