import * as nodePath from 'path';
import * as fs from 'fs/promises';

import * as pkInstall from '../lib/validator/plugin-installed';
import * as check from '../check-install';

import {
  setupTestProject,
  teardownTestProject,
} from '../../config/tests/helper';
import { init } from '../../config/init';
import * as trans from '../../config/parser/transpiler';

// import { setupTestProject, teardownTestProject } from './helper';

describe('Ymir check install', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'ci');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Init project', () => {
    beforeAll(async () => {
      await setupTestProject(init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('Parse plugins', () => {
      describe('Plugins with setup', () => {
        beforeAll(async () => {
          const ssm = trans.transpileObjectToStack({
            DESCRIBE: {
              alias: 'ssm',
            },
            LOCATION: {
              path: './node_modules/@onevor/ymir-resolver-ssm',
              'install_cmd?': 'npm install @onevor/ymir-resolver-ssm',
              'isGlobal?': false,
            },
          });

          const azure = trans.transpileObjectToStack({
            DESCRIBE: {
              alias: 'azure-key-vault',
            },
            LOCATION: {
              path: './node_modules/@onevor/ymir-resolver-azure-key-vault',
              'install_cmd?':
                'npm install @onevor/ymir-resolver-azure-key-vault',
              'isGlobal?': false,
            },
          });

          const gcp = trans.transpileObjectToStack({
            DESCRIBE: {
              alias: 'gcp-secret-manager',
            },
            LOCATION: {
              path: './node_modules/@onevor/ymir-resolver-gcp-secret-manager',
              'install_cmd?':
                'npm install @onevor/ymir-resolver-gcp-secret-manager',
              'isGlobal?': false,
            },
          });
          const pluginFiles = [
            [nodePath.join(ymirPath, 'plugins', 'resolver_ssm'), ssm],
            [
              nodePath.join(ymirPath, 'plugins', 'resolver_gcp-secret-manager'),
              gcp,
            ],
            [
              nodePath.join(ymirPath, 'plugins', 'resolver_azure-key-vault'),
              azure,
            ],
          ];

          await Promise.all(
            pluginFiles.map(([pluginFile, data]) =>
              fs.writeFile(pluginFile, data)
            )
          );
        });
        it('should locate closest pk.json file', async () => {
          const path = await pkInstall.locateNearestPackageJson(cwd);
          const rel = path.split('/ymir/')[1];
          expect(rel).toEqual('packages/ymir-core-cli/package.json');
        });
        it('should locate closest node_modules dir', async () => {
          const path = await pkInstall.locateNearestNodeModules(cwd);
          const rel = path.split('/ymir/')[1];
          expect(rel).toEqual('packages/ymir-core-cli/node_modules');
        });
        it('should return false on not installed pk', async () => {
          const name = '@onevor/ymir-resolver-ssm';
          const hasDep = await pkInstall.checkIfPluginIsInstalledInPackageJson(
            cwd,
            name
          );
          expect(hasDep).toEqual(false);
        });
        it('should return true on installed pk', async () => {
          const name = 'dotenv';
          const hasDep = await pkInstall.checkIfPluginIsInstalledInPackageJson(
            cwd,
            name
          );
          expect(hasDep).toEqual(true);
        });
        it('should return path to global node_modules', async () => {
          const path = await pkInstall.locateGlobalNodeModulesPath();
          // TODO: hard to validate, this could be different on machines
          // My path /Users/[user]/.nvm/versions/node/v16.18.0/lib/node_modules
          const p = path.trim().split('/');
          expect(p[0]).toEqual('');
          expect(p[1]).toEqual('Users');
          expect(p[p.length - 1]).toEqual('node_modules');
          expect(path).toBeTruthy();
        });
        it('should return true on fully installed local pk in node_modules', async () => {
          const name = 'dotenv';
          const path = await pkInstall.locateNearestNodeModules(cwd);
          const [valid, errorMsg] =
            await pkInstall.checkIfPackageIsInstalledInNodeModules(path, name);
          expect(valid).toEqual(true);
          expect(errorMsg).toEqual('');
        });
        it('should return true on fully installed global pk in node_modules', async () => {
          const name = 'npm';
          const path = await pkInstall.locateGlobalNodeModulesPath();
          const [valid, errorMsg] =
            await pkInstall.checkIfPackageIsInstalledInNodeModules(path, name);
          expect(valid).toEqual(true);
          expect(errorMsg).toEqual('');
        });
        it('should return error on missing local pk in node_modules', async () => {
          const name = 'does-not-exist';
          const path = await pkInstall.locateNearestNodeModules(cwd);
          const [valid, errorMsg] =
            await pkInstall.checkIfPackageIsInstalledInNodeModules(path, name);
          expect(valid).toEqual(false);
          expect(errorMsg.trim().split(':')[0]).toEqual(
            'Package does not exist at'
          );
        });
        it('should return error on missing global pk in node_modules', async () => {
          const name = 'does-not-exist';
          const path = await pkInstall.locateGlobalNodeModulesPath();
          const [valid, errorMsg] =
            await pkInstall.checkIfPackageIsInstalledInNodeModules(path, name);
          expect(valid).toEqual(false);
          expect(errorMsg.trim().split(':')[0]).toEqual(
            'Package does not exist at'
          );
        });
        it('should return path to globally installed package', async () => {
          const name = 'npm';
          const path = await pkInstall.locateInstallPathForPk(cwd, name);

          expect(path).toBeTruthy();
          expect(path.split('/').pop()).toEqual(name);
        });
        it('should return path to locally installed package', async () => {
          const name = 'dotenv';
          const path = await pkInstall.locateInstallPathForPk(cwd, name);

          expect(path).toBeTruthy();
          expect(path.split('/').pop()).toEqual(name);
        });
      });
    });
  });
});
