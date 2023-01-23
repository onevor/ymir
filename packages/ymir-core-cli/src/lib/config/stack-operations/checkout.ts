import * as nodePath from 'path';
import * as fs from 'fs/promises';

import { ymirProjectFolderPath } from '../helper';

/**
 * Checkout a stack:
 * Like git, this will change the current stack to the one specified
 * So that the cli can work with the correct stack, when doing things like add, remove, etc.
 *
 * TODO:
 * Should not be able to checkout a stack that does not exist
 * need to create it first;
 *
 */

export async function checkoutStack(
  cwd: string,
  stackName: string,
  stackConfigPathOverride?: string
) {
  const coPath = nodePath.join(ymirProjectFolderPath(cwd), 'current_stack');
  const content = `[${stackName}]: ${
    stackConfigPathOverride || `./stacks/${stackName}`
  }`;
  await fs.writeFile(coPath, content);
}
