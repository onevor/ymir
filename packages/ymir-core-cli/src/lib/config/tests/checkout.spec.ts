import * as nodePath from 'path';
import * as fs from 'fs/promises';

import { checkoutStack } from '../stack-operations/checkout';
import * as init from '../init';

import { setupTestProject, teardownTestProject } from './helper';

describe('Ymir init', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'co');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Init project', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    it('checkout stack', async () => {
      const currentStackFilePath = nodePath.join(ymirPath, 'current_stack');
      const stackBefore = await fs.readFile(currentStackFilePath, 'utf-8');
      expect(stackBefore).toEqual('[dev]: ./stacks/dev');

      await checkoutStack(cwd, 'prod');

      const stackAfter = await fs.readFile(currentStackFilePath, 'utf-8');
      expect(stackAfter).toEqual('[prod]: ./stacks/prod');
    });
  });
});
