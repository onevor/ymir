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

describe('ymir init', () => {
  it('should create a new ymir project', async () => {
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
});
