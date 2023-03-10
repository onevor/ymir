import * as nodePath from 'path';

import * as file from '../../config/file';
import * as install from '../lib/resolver-operations/install';
import {
  setupTestProject,
  teardownTestProject,
} from '../../config/tests/helper';
import { init } from '../../config/init';

describe('Ymir install plugin', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'install');
  const ymirPath = nodePath.join(cwd, '.ymir');
  describe('Init project', () => {
    const testPluginRelativePath = nodePath.join('plugins', 'test');
    let existingTestPluginFile: any;

    beforeAll(async () => {
      await setupTestProject(init, cwd);
      existingTestPluginFile = {
        DESCRIBE: {
          alias: 'test',
          'pk_name?': 'dotenv',
        },
        LOCATION: {
          path: './node_modules/dotenv',
          'install_cmd?': 'npm i -D dotenv',
          'is_global?': false,
        },
      };

      await file.writeYmirFileFromObject(
        ymirPath,
        testPluginRelativePath,
        existingTestPluginFile,
        {},
        ['alias', 'path']
      );
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('Should install plugin', () => {
      it('Should install new plugin with path', async () => {
        const pathToLocalPlugin = nodePath.join(
          __dirname,
          '../../../../node_modules/dotenv'
        );
        const alias = 'env';
        const [err, result] = await install.installPluginWithPath(
          ymirPath,
          pathToLocalPlugin,
          alias,
          {}
        );

        const [newFile] = await file.getYmirFileAsObject(
          ymirPath,
          nodePath.join('plugins', 'env'),
          false
        );

        newFile.LOCATION.path = newFile.LOCATION.path.trim().split('ymir/')[1];

        expect(err).toBeNull();
        expect(newFile.DESCRIBE).toEqual({
          alias: 'env',
          'pk_name?': 'dotenv',
        });
        expect(newFile.LOCATION).toEqual({
          path: 'packages/ymir-core-cli/node_modules/dotenv',
          'install_cmd?': 'npm i -D dotenv',
          'is_global?': false,
        });
      });
      it('Should install plugin with path when plugin already is installed', async () => {
        const [before, comments] = await file.getYmirFileAsObject(
          ymirPath,
          testPluginRelativePath
        );
        expect(before).toEqual(existingTestPluginFile);
        const pathToLocalPlugin = nodePath.join(
          __dirname,
          '../../../../node_modules/dotenv'
        );
        const alias = 'test';
        const [err, result] = await install.installPluginWithPath(
          ymirPath,
          pathToLocalPlugin,
          alias,
          {}
        );

        const [newFile] = await file.getYmirFileAsObject(
          ymirPath,
          nodePath.join('plugins', 'test'),
          false
        );

        newFile.LOCATION.path = newFile.LOCATION.path.trim().split('ymir/')[1];

        expect(err).toBeNull();
        expect(newFile.DESCRIBE).toEqual({
          alias: 'test',
          'pk_name?': 'dotenv',
        });
        expect(newFile.LOCATION).toEqual({
          path: 'packages/ymir-core-cli/node_modules/dotenv',
          'install_cmd?': 'npm i -D dotenv',
          'is_global?': false,
        });
      });
      it('Should error on install plugin with path when path is invalid', async () => {
        const invalidPath = nodePath.join(
          __dirname,
          '../../node_modules/dotenv'
        );
        const alias = 'error';
        const [err, result] = await install.installPluginWithPath(
          ymirPath,
          invalidPath,
          alias,
          {}
        );

        expect(result).toBeNull();
        expect(err.code).toEqual('PLUGIN_NOT_FOUND');
        expect(err.message.split(':')[0]).toEqual(
          'Unable to locate plugin at path'
        );
      });
    });
  });
});
