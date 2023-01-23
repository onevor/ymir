import * as nodePath from 'path';
import * as fs from 'fs/promises';

import { exists } from '../../fs';

import * as init from '../init';
import { setupTestProject, teardownTestProject } from './helper';
import * as trans from '../parser/transpiler';

jest.setTimeout(200000);

describe('Ymir init', () => {
  const cwd = nodePath.join(__dirname, 'tmp', 'init');
  const ymirPath = nodePath.join(cwd, '.ymir');

  describe('Init project', () => {
    beforeAll(async () => {
      await setupTestProject(init.init, cwd);
    });
    afterAll(async () => {
      await teardownTestProject(cwd);
    });
    describe('Root structure', () => {
      const expectedFiles = [
        'current_stack',
        'stacks',
        'stack-config',
        'plugins',
      ];

      expectedFiles.forEach((name) => {
        it(`should have resource ${name} in ymir root`, async () => {
          const path = nodePath.join(ymirPath, name);
          const fileExists = await exists(path);
          expect(fileExists).toEqual(true);
        });
      });
    });
    describe('Stack structure', () => {
      const stackBase = nodePath.join(ymirPath, 'stacks');
      const templateBase = nodePath.join(
        __dirname,
        '../',
        'templates',
        'stack-files'
      );
      const expectedFiles = ['default', 'dev', 'stage', 'prod'];

      expectedFiles.forEach((name) => {
        it(`should have resource ${name} in ymir root`, async () => {
          const filePath = nodePath.join(stackBase, name);
          const templatePath = nodePath.join(templateBase, name);
          const file = await fs.readFile(filePath, 'utf8');
          const template = await fs.readFile(templatePath, 'utf8');
          expect(file).toEqual(template);
        });
      });
    });
    describe('Stack config structure', () => {
      const stackBase = nodePath.join(ymirPath, 'stack-config');
      const templateBase = nodePath.join(
        __dirname,
        '../',
        'templates',
        'stack-config'
      );
      const expectedFiles = ['default', 'dev', 'stage', 'prod'];
      expectedFiles.forEach((name) => {
        it(`should have resource ${name} in ymir root`, async () => {
          const filePath = nodePath.join(stackBase, name);
          const templatePath = nodePath.join(templateBase, name);
          const file = await fs.readFile(filePath, 'utf8');
          const template = await fs.readFile(templatePath, 'utf8');
          expect(file).toEqual(template);
        });
      });
    });
    describe('Create new file', () => {
      it('should create a file form a template', async () => {
        const templatePath = nodePath.join(
          __dirname,
          '../',
          'templates',
          'stack-files',
          'default'
        );
        const relPath = nodePath.join('stacks', 'fileFromTemplate');
        const filePath = nodePath.join(ymirPath, relPath);
        const createF = await init.createFileFromTemplate(
          ymirPath,
          relPath,
          templatePath,
          {}
        );
        // const newFile = await
        // Get file, validate it;
        const createdFile = await fs.readFile(filePath, 'utf8');
        const templateFile = await fs.readFile(templatePath, 'utf8');
        expect(createdFile).toEqual(templateFile);
      });
      it('should create an empty file', async () => {
        const templatePath = nodePath.join(
          __dirname,
          '../',
          'templates',
          'stack-files',
          'default'
        );
        const relPath = nodePath.join('stacks', 'fileFromTemplate');
        const filePath = nodePath.join(ymirPath, relPath);
        await init.createFileFromTemplate(ymirPath, relPath, templatePath, {
          empty: true,
        });
        // const newFile = await
        // Get file, validate it;
        const createdFile = await fs.readFile(filePath, 'utf8');
        expect(createdFile).toEqual('');
      });
      it('should create a file form from provided data', async () => {
        const templatePath = nodePath.join(
          __dirname,
          '../',
          'templates',
          'stack-files',
          'default'
        );
        const relPath = nodePath.join('stacks', 'fileFromTemplate');
        const filePath = nodePath.join(ymirPath, relPath);
        const dataObject = {
          DESCRIBE: {
            'description?': 'Description of the stack',
          },
          PORT: {
            path: '/here/hi',
            'description?': 'Port of the stack',
          },
        };
        const data = trans.transpileObjectToStack(dataObject);
        const createF = await init.createFileFromTemplate(
          ymirPath,
          relPath,
          templatePath,
          { data }
        );
        const createdFile = await fs.readFile(filePath, 'utf8');
        expect(createdFile).toEqual(data);
      });
      // it('should create a file form a template and provided data', async () => {

      // });
      it('should create a file form a template and override props', async () => {
        const templatePath = nodePath.join(
          __dirname,
          '../',
          'templates',
          'stack-files',
          'default'
        );
        const relPath = nodePath.join('stacks', 'fileFromTemplate');
        const filePath = nodePath.join(ymirPath, relPath);
        const override = {
          keyMap: {
            PORT: 'HTTP_PORT',
          },
          valueMap: {
            HTTP_PORT: {
              path: '/here/hi',
            },
          },
        };
        const createF = await init.createFileFromTemplate(
          ymirPath,
          relPath,
          templatePath,
          { override }
        );
        const createdFile = await fs.readFile(filePath, 'utf8');
        const templateFile = await fs.readFile(templatePath, 'utf8');

        const [creObj] = trans.parseStackFile(createdFile);
        const [tempObj] = trans.parseStackFile(templateFile);

        delete tempObj.PORT;
        tempObj.HTTP_PORT = {
          path: '/here/hi',
        };
        expect(creObj).toEqual(tempObj);
      });
    });
  });
});
