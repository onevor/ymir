/**
 * All updates to a stack should happen here;
 */
import * as nodePath from 'path';

import { YmirPath, StackName } from '../types/stack';
import * as fs from '../config/helper/fs';
import * as get from './get';
import * as trans from '../config/parser/transpiler';

// TODO: type stackProperties
export async function getAndMerge(
  ymirPath: YmirPath,
  stackName: StackName,
  stackProperties: any
) {
  const stackPath = nodePath.join(ymirPath, 'stacks', stackName);
  const stackExists = await fs.exists(stackPath);
  if (!stackExists) {
    return [
      {
        code: 'STACK_NOT_FOUND',
        message: 'Unable to update stack, stack not found',
        stackName,
        stackPath,
      },
      null,
    ];
  }
  const [currentStackData, currentComments] = await get.parsedStack(
    ymirPath,
    stackName,
    true
  );

  // TODO: add options, should we overwrite or not?
  // If conflict, error | overwrite, if overwrite should current or new take precedence?
  // Should be in opt, error by default.
  const merged = { ...currentStackData, ...stackProperties };
  const stackFileUpdated = trans.transpileObjectToStack(
    merged,
    currentComments
  );

  await fs.writeFile(stackPath, stackFileUpdated, 'utf8');
  return [null, stackFileUpdated];
}
