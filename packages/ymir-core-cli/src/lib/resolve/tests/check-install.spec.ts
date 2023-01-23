import * as nodePath from 'path';
import * as fs from 'fs/promises';

import * as check from '../check-install';
import {
  setupTestProject,
  teardownTestProject,
} from '../../config/tests/helper';
import { init } from '../../config/init';
import * as trans from '../../config/parser/transpiler';

// import { setupTestProject, teardownTestProject } from './helper';

describe('Ymir parse plugin', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'parsePlugin');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Init project', () => {
    let configFiles: string[];
    let stackFiles: string[];
    let configAltered: string[];
    let stackAltered: string[];

    let confDevAltered: any;
    let confProdAltered: any;
    let stackDevAltered: any;
    let stackProdAltered: any;
    beforeAll(async () => {
      await setupTestProject(init, cwd);
      const files = await check.getAllConfigAndStackFiles(ymirPath);
      [configFiles, stackFiles] = files;

      [confDevAltered] = trans.parseStackFile(configFiles[1]);
      confDevAltered.DEFAULT_RESOLVER = {};
      confDevAltered.DEFAULT_RESOLVER.name = 'gcp-secret-manager';
      confDevAltered.DEFAULT_RESOLVER.path =
        './node_modules/@vor/ymir-resolver-gcp-secret-manager';
      [confProdAltered] = trans.parseStackFile(configFiles[2]);
      confProdAltered.DEFAULT_RESOLVER = {};
      confProdAltered.DEFAULT_RESOLVER.name = 'azure-key-vault';
      confProdAltered.DEFAULT_RESOLVER.path =
        './node_modules/@vor/ymir-resolver-azure-key-vault';

      configAltered = [
        configFiles[0],
        trans.transpileObjectToStack(confDevAltered, null, ['name', 'path']),
        trans.transpileObjectToStack(confProdAltered, null, ['name', 'path']),
        configFiles[3],
      ];

      [stackDevAltered] = trans.parseStackFile(stackFiles[1]);
      [stackProdAltered] = trans.parseStackFile(stackFiles[2]);
      stackDevAltered.TEST_VAR['resolver?'] = 'gcp-secret-manager';
      stackProdAltered.SERVER_URL['resolver?'] = 'azure-key-vault';

      stackAltered = [
        stackFiles[0],
        trans.transpileObjectToStack(stackDevAltered),
        trans.transpileObjectToStack(stackProdAltered),
        stackFiles[3],
      ];
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('Parse Config', () => {
      it('should get all config and stack files', async () => {
        expect(configFiles.length).toEqual(4);
        expect(stackFiles.length).toEqual(4);
      });
      it('should get default resolver form config file', async () => {
        const resolver = await check.getDefaultResolverAliasFromConfig(
          configFiles[0]
        );
        expect(resolver).toEqual('ssm');
      });
      it('should get default resolver form all config files', () => {
        const resolvers =
          check.getResolverNamesFromAllStackConfigs(configAltered);

        expect(resolvers).toEqual([
          'ssm',
          'gcp-secret-manager',
          'azure-key-vault',
          null,
        ]);
      });
      it('should return null if config does not have a default resolver', () => {
        const resolver = check.getDefaultResolverAliasFromConfig(
          configFiles[1]
        );
        expect(resolver).toEqual(null);
      });
    });
    describe('Parse Stack', () => {
      it('should get resolver aliases from stack file', () => {
        const data = check.getResolversFromStack(stackFiles[0]);
        expect(data).toEqual(['ssm']);
      });
      it('should get resolver aliases from all stack files', async () => {
        const data = check.getResolversFromAllStacks(stackAltered);
        expect(data).toEqual([
          'ssm',
          stackDevAltered.TEST_VAR['resolver?'],
          stackProdAltered.SERVER_URL['resolver?'],
        ]);
      });
    });
    describe('Parse All', () => {
      it('should get all resolver names', async () => {
        const names = check.getAllResolverNamesFromStackAndConfigFiles(
          configAltered,
          stackAltered
        );

        expect(names).toEqual(['ssm', 'gcp-secret-manager', 'azure-key-vault']);
      });
    });
    // describe('Parse plugins', () => {
    //   describe('Plugins with setup', () => {
    //     beforeAll(async () => {
    //       const ssm = trans.transpileObjectToStack({
    //         DESCRIBE: {
    //           alias: 'ssm',
    //         },
    //         LOCATION: {
    //           path: './node_modules/@vor/ymir-resolver-ssm',
    //           'install_cmd?': 'npm install @vor/ymir-resolver-ssm',
    //           'isGlobal?': false,
    //         },
    //       });

    //       const azure = trans.transpileObjectToStack({
    //         DESCRIBE: {
    //           alias: 'azure-key-vault',
    //         },
    //         LOCATION: {
    //           path: './node_modules/@vor/ymir-resolver-azure-key-vault',
    //           'install_cmd?': 'npm install @vor/ymir-resolver-azure-key-vault',
    //           'isGlobal?': false,
    //         },
    //       });

    //       const gcp = trans.transpileObjectToStack({
    //         DESCRIBE: {
    //           alias: 'gcp-secret-manager',
    //         },
    //         LOCATION: {
    //           path: './node_modules/@vor/ymir-resolver-gcp-secret-manager',
    //           'install_cmd?':
    //             'npm install @vor/ymir-resolver-gcp-secret-manager',
    //           'isGlobal?': false,
    //         },
    //       });
    //       const pluginFiles = [
    //         [nodePath.join(ymirPath, 'plugins', 'resolver_ssm'), ssm],
    //         [
    //           nodePath.join(ymirPath, 'plugins', 'resolver_gcp-secret-manager'),
    //           gcp,
    //         ],
    //         [
    //           nodePath.join(ymirPath, 'plugins', 'resolver_azure-key-vault'),
    //           azure,
    //         ],
    //       ];

    //       await Promise.all(
    //         pluginFiles.map(([pluginFile, data]) =>
    //           fs.writeFile(pluginFile, data)
    //         )
    //       );
    //     });
    //   });
    // });
  });
});
