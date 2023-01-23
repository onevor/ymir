import * as nodePath from 'path';

import * as init from '../init';
import * as helper from '../helper';

import { setupTestProject, teardownTestProject } from './helper';

jest.setTimeout(200000);

describe('Ymir helper', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'help');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Path', () => {
    it('should get folder path from cwd', async () => {
      const path = await helper.getYmirProjectPath(cwd);
      expect(path).toEqual(nodePath.join(cwd));
    });
    it('should get folder path from cwd + relative path', async () => {
      const path = await helper.getYmirProjectPath(cwd, 'project');
      expect(path).toEqual(nodePath.join(cwd, 'project'));
    });
    it('should get folder path from absolute path', async () => {
      const path = await helper.getYmirProjectPath(cwd, null, '/hello/world');
      expect(path).toEqual('/hello/world');
    });
  });

  describe('Stack', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    it('should get current stack', async () => {
      const [stackName, stackFilePath] = await helper.getCurrentStack(ymirPath);
      expect(stackName).toEqual('dev');
      expect(stackFilePath).toEqual(nodePath.join(ymirPath, 'stacks', 'dev'));
    });
    it('should return true on project exists', async () => {
      const projectExists = await helper.projectExists(cwd);
      expect(projectExists).toEqual(true);
    });
    it('should return true on stack exists', async () => {
      const projectExists = await helper.stackExists(cwd, 'dev');
      expect(projectExists).toEqual(true);
    });
  });
});
