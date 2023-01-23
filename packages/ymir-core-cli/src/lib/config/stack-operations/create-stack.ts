import * as helper from '../helper';
import * as fs from 'fs/promises';

/**
 * TODO:
 * Options:
 * - copy stack meta from existing stack
 * - checkout stack when created
 */
export async function createNewStack(
  projectPath: string,
  name: string,
  options?: any
) {
  const projectExists = await helper.projectExists(projectPath);

  if (!projectExists) {
    throw new Error(`Project does not exist at path: ${projectPath}`);
  }

  const stackExists = await helper.stackExists(projectPath, name);

  if (stackExists) {
    throw new Error(`Stack ${name} already exists`);
  }

  const stackPath = helper.getStackPath(projectPath, name);
  const stackConfPath = helper.getStackConfigPath(projectPath, name);
  const stackData = `[DESCRIBE]\n  description?: This is the default stack, variables that are the same in all stacks should be defined here\n`;
  const stackConfData = '';
  await fs.writeFile(stackPath, stackData);
  await fs.writeFile(stackConfPath, stackConfData);

  return;
}
