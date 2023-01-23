import * as nodePath from 'path';
import * as fs from '../../../config/helper/fs';
import * as file from '../../../config/file';
// Install a new plugin resolver

/**
 * TODO:
 * - method for installing with input
 *   - run npm install (local or global)
 *   - build plugin file
 *
 * - method for when pk is installed
 *   - need more info, path to plugin file / full pk name
 *
 * - base method
 *   - take in alias and full pk name
 *   - check if it is installed
 *   - if not install
 *   - build plugin file
 */

type ErrorResponse = {
  code: string;
  message: string;
};

type SuccessResponse = any;

/**
 * This method is to install a plugin to ymir, when the plugin is already installed on the system
 * The path here is the absolute path to the location of the installed plugin dir;
 */
export async function installPluginWithPath(
  ymirPath: string,
  path: string,
  alias: string,
  opt: any
): Promise<[ErrorResponse | null, SuccessResponse | null]> {
  const pluginExists = await fs.exists(path);
  if (!pluginExists) {
    return [
      {
        code: 'PLUGIN_NOT_FOUND',
        message: `Unable to locate plugin at path: ${path}`,
      },
      null,
    ];
  }

  const relativePath = nodePath.join('plugins', `${alias}`);
  const fullPluginPath = nodePath.join(ymirPath, relativePath);

  const pluginFileExists = await fs.exists(fullPluginPath);

  const pluginFile: any = {};
  const comments: any = {};

  if (pluginFileExists) {
    const [existingPluginFile, existingComments] =
      await file.getYmirFileAsObject(ymirPath, relativePath, true);
    Object.assign(pluginFile, existingPluginFile);
    Object.assign(comments, existingComments);
  }

  if (!Object.hasOwnProperty.call(pluginFile, 'DESCRIBE')) {
    pluginFile.DESCRIBE = {};
  }

  if (!Object.hasOwnProperty.call(pluginFile, 'LOCATION')) {
    pluginFile.LOCATION = {};
  }

  const pluginPkName = opt.pkName
    ? opt.pkName
    : path.trim().split('node_modules/')[1];
  // TODO: should have a file in conf that has the path to the project, so i can easily check if this path
  // is to a local plugin or if it is global
  const isGlobal = opt.isGlobal ? opt.isGlobal : false;
  const installMod = isGlobal ? '-g' : '-D';
  const installScript = opt.installScript
    ? opt.installScript
    : `npm i ${installMod} ${pluginPkName}`;

  pluginFile.DESCRIBE.alias = alias;
  pluginFile.DESCRIBE['pk_name?'] = pluginPkName;

  pluginFile.LOCATION.path = path;
  pluginFile.LOCATION['install_cmd?'] = installScript;
  pluginFile.LOCATION['is_global?'] = isGlobal;

  const result = await file.writeYmirFileFromObject(
    ymirPath,
    relativePath,
    pluginFile,
    comments,
    ['alias', 'path']
  );
  return [null, result];
}
