/**
 * Need to set up a temp env that i can control for testing the cli
 *
 * 1. need to be able to mock `npm root` with and with out -g
 * 2. need to create a temp folder for the ymir project
 * 3. need to tear down the temp folder after the test
 * 4. easy helpers to set up a project in different states
 *   - with npm init
 *   - with ymir init
 *   - with git init
 *   - with global installed plugins
 *   - with local installed plugins
 */

import { randomUUID } from 'crypto';
import * as nodePath from 'path';
import * as fs from 'fs/promises';

import { exists } from '../../lib/fs';
import { exec } from 'child_process';

export type PathLike = string;
export type TestDir = PathLike;

const YMIR_TEST_DIR = 'ymir-test';

export async function execCommand(
  command: string,
  options?: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.toString('utf-8'));
    });
  });
}

const distPath = nodePath.join(__dirname, '../../../../../', 'dist');
const coreCliPath = nodePath.join(distPath, 'ymir-core-cli');
const ymirBuild = nodePath.join(coreCliPath, 'src', 'bin', 'index.js');

const ymirCurrentBuildSourceString = `source ${nodePath.join(
  __dirname,
  '../../../',
  'scripts',
  'source-ymir.sh'
)}`;

const shortRandom = () => randomUUID().split('-')[0];
const createTestDirPath = (path: PathLike, random?: string): TestDir =>
  nodePath.join(path, YMIR_TEST_DIR, random || shortRandom());

export function validateOSCanRunTests() {
  const isMac = process.platform === 'darwin';
  // const isLinux = process.platform === 'linux';
  // const isWindows = process.platform === 'win32';

  if (isMac) {
    return true;
  }

  throw new Error(`Unsupported OS: ${process.platform}`);
}
validateOSCanRunTests();

export async function validateTestDirPath(path: PathLike) {
  const testDirExists = await exists(path);
  if (!testDirExists) {
    throw new Error(`Test path does not exist: ${path}`);
  }
  const isDir = (await fs.lstat(path)).isDirectory();
  if (!isDir) {
    throw new Error(`Test path is not a directory: ${path}`);
  }

  const ls = await fs.readdir(path);

  if (ls.length === 0) {
    throw new Error(`Test directory is empty: ${path}`);
  }

  return true;
}

export async function validateSafeToDelete(testPath: TestDir) {
  const isAbsolute = nodePath.isAbsolute(testPath);
  if (!isAbsolute) {
    throw new Error(`Test path is not absolute: ${testPath}`);
  }

  const pathLevels = testPath.split(nodePath.sep);
  const isYmirTestDir = pathLevels.includes(YMIR_TEST_DIR);

  // Path should be at least 2 levels deep
  // EG. not `/User/[userName]`
  const isRoot = pathLevels.length <= 3;
  if (isRoot) {
    throw new Error(`Test path is a root path: ${testPath}`);
  }

  if (!isYmirTestDir) {
    throw new Error(`Test path is not a ymir test dir: ${testPath}`);
  }

  return true;
}

export async function createTestDir(path: PathLike): Promise<TestDir> {
  const testPath = createTestDirPath(path);
  await fs.mkdir(testPath, { recursive: true });
  return testPath;
}

export async function removeTestDir(path: TestDir): Promise<void> {
  await validateTestDirPath(path);
  await validateSafeToDelete(path);
  await fs.rmdir(path, { recursive: true });
}

export async function setupTest(path: PathLike): Promise<TestDir> {
  const testPath = await createTestDir(path);
  return testPath;
}

export async function teardownTest(testPath: TestDir) {
  await removeTestDir(testPath);
}

export const setupScripts = {
  npmInit: async (testPath: TestDir) => {
    try {
      const res = await execCommand('npm init -y', { cwd: testPath });
      console.log(res);
    } catch (error) {
      console.error('Unable to run npm init', error);
      throw error;
    }
  },
  npmInstall: async (testPath: TestDir, pk: string, dev = false) => {
    try {
      const res = await execCommand(`npm i ${dev ? '-D' : ''} ${pk}`, {
        cwd: testPath,
      });
      console.log(res);
    } catch (error) {
      console.error('Unable to run npm init', error);
      throw error;
    }
  },
  ymirInit: async (testPath: TestDir) => {
    try {
      const res = await execCommand(`${ymirBuild} init`, { cwd: testPath });
      console.log(res);
    } catch (error) {
      console.error('Unable to run ymir init', error);
      throw error;
    }
  },
  ymirRun: async (testPath: TestDir, command: string) => {
    try {
      const res = await execCommand(`${ymirBuild} ${command}`, {
        cwd: testPath,
      });
      console.log(res);
    } catch (error) {
      console.error(`Unable to run ymir command: ${command}`, error);
      throw error;
    }
  },
  gitInit: async (testPath: TestDir) => {
    try {
      const res = await execCommand('git init', { cwd: testPath });
      console.log(res);
    } catch (error) {
      console.error('Unable to run git init', error);
      throw error;
    }
  },
};
