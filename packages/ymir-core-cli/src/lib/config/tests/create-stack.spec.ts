import * as nodePath from 'path';

import { exists } from '../../fs';

import { createNewStack } from '../stack-operations/create-stack';
import * as init from '../init';

import { setupTestProject, teardownTestProject } from './helper';

describe('Ymir Create new stack', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'create-stack');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('', () => {
      it('should create a new stack', async () => {
        const name = 'new-test-stack';
        await createNewStack(cwd, name, {});
        const stackExists = await exists(
          nodePath.join(ymirPath, 'stacks', name)
        );
        expect(stackExists).toEqual(true);
      });
    });
  });
});
