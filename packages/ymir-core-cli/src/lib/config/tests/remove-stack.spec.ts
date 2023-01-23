import * as nodePath from 'path';

import { exists } from '../../fs';

import { removeStack } from '../stack-operations/remove-stack';
import * as init from '../init';

import { setupTestProject, teardownTestProject } from './helper';

describe('Ymir remove a stack', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'remove-stack');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('', () => {
      it('should remove a stack', async () => {
        const name = 'dev';
        const stackPath = nodePath.join(ymirPath, 'stacks', name);
        const existBefore = await exists(stackPath);
        expect(existBefore).toEqual(true);
        await removeStack(cwd, name, {});
        const stackExists = await exists(stackPath);
        expect(stackExists).toEqual(false);
      });
    });
  });
});
