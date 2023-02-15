import * as nodePath from 'path';

import * as test from './helper';

jest.setTimeout(200000);

describe('ymir init', () => {
  it('should create a new ymir project', async () => {
    // Need to create test dir in project root, or NPM will complain
    const path = nodePath.resolve(__dirname, '../../../../../', 'tmp');
    const testPath = await test.setupTest(path);
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
