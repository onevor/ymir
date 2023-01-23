import * as fs from 'fs/promises';
import * as nodePath from 'path';

import * as edit from '../stack-operations/edit-stack-file';
import * as init from '../init';

import { setupTestProject, teardownTestProject } from './helper';
import * as helper from '../helper';

describe('Ymir edit stack', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'edit-stack');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Edit', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('Append to stack', () => {
      it('should append key to stack', async () => {
        const prop = {
          key: 'TEST_PROP',
          content: {
            path: '/test/prop/path',
            description: 'test prop description',
            required: false,
            resolver: 'ssm',
          },
        };
        const opt = {
          globalStack: true,
        };
        const currentStack = 'dev';
        const before = await helper.getStackData(ymirPath, 'default');
        const data = await edit.addNewProperty(
          currentStack,
          ymirPath,
          prop,
          opt
        );
        const after = await helper.getStackData(ymirPath, 'default');

        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');

        expect(afterLines.length).toBeGreaterThan(beforeLines.length);

        const indexOfAdded = afterLines.indexOf('[TEST_PROP]');

        // TODO: validate that it has all the props;

        expect(indexOfAdded).toBeGreaterThan(-1);

        const afterWithoutAdded = afterLines.slice(0, indexOfAdded);

        expect(afterWithoutAdded).toEqual(beforeLines);
      });
    });
    describe('Edit key in stack', () => {
      it('should edit a prop', async () => {
        const prop = {
          key: 'TEST_VAR',
          content: {
            path: '/new/test/path',
            description: 'Added a description',
          },
          comment: {
            description: 'with a comment',
          },
        };
        const opt = {};
        const currentStack = 'prod';

        const before = await helper.getStackData(ymirPath, currentStack);

        await edit.updateProperty(currentStack, ymirPath, prop, opt);

        const after = await helper.getStackData(ymirPath, currentStack);

        await fs.writeFile(nodePath.join(__dirname, 'before-e.txt'), before);
        await fs.writeFile(nodePath.join(__dirname, 'after-e.txt'), after);

        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');

        expect(beforeLines.length).toBeLessThan(afterLines.length);

        const indexOfPropBefore = beforeLines.indexOf('[TEST_VAR]');
        const indexOfPropAfter = afterLines.indexOf('[TEST_VAR]');

        expect(indexOfPropBefore).toBeGreaterThan(-1);
        expect(indexOfPropAfter).toBeGreaterThan(-1);

        const beforePropOnly = beforeLines.slice(indexOfPropBefore);
        const afterPropOnly = afterLines.slice(indexOfPropAfter);

        expect(afterPropOnly.length).toBeGreaterThan(beforePropOnly.length);
      });
    });
    describe('Remove from stack', () => {
      it('should remove a prop', async () => {
        const prop = {
          key: 'TEST_VAR',
        };
        const opt = {};
        const currentStack = 'stage';
        const before = await helper.getStackData(ymirPath, currentStack);
        await edit.removeProperty(currentStack, ymirPath, prop, opt);
        const after = await helper.getStackData(ymirPath, currentStack);

        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');

        expect(beforeLines.length).toBeGreaterThan(afterLines.length);

        const indexOfRemoved = beforeLines.indexOf('[TEST_VAR]');

        expect(indexOfRemoved).toBeGreaterThan(-1);

        const beforeWithoutRemoved = beforeLines.slice(0, indexOfRemoved);

        expect(beforeWithoutRemoved).toEqual(afterLines);
      });
    });
  });
});
