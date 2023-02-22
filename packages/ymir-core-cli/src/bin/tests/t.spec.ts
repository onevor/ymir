import * as test from './helper';

jest.setTimeout(200000);

/**
 * Should be able to make tests like:
 * - Create a new ymir project
 * - create a new ymir project with no plugins
 * - create ymir project with global plugins
 * - create ymir project with local plugins
 * - create ymir project with global and local plugins
 *
 * - test all commands
 *
 */
describe('ymir', () => {
  describe('ymir init', () => {
    it('should create a new ymir project with out plugins', async () => {
      const testPath = await test.setupTest(test.testDirPath);
      // Need to create test dir in project root, or NPM will complain
      // await test.setupScripts.npmInit(testPath);
      // await test.setupScripts.npmInstall(
      //   testPath,
      //   '@onevor/ymir-plugin-ssm',
      //   true
      // );
      await test.setupScripts.ymirInit(testPath);
      await test.setupScripts.ymirRun(testPath, '-v');
      // await test.teardownTest(testPath);
    });
    it('should create a new ymir project with plugins', async () => {
      // create new npm project
      // install plugins
    });
  });

  describe('Edit config', () => {});

  describe('Install new plugin', () => {});

  describe('Import env', () => {});

  describe('Add Update Remove from stack', () => {});

  describe('Checkout', () => {});

  describe('Export', () => {});
});
