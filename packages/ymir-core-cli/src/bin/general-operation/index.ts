import * as nodePath from 'path';

import * as helper from '../../lib/config/helper';
import { isInProject } from '../lib/index';
import * as get from '../../lib/plugin/get-plugin';
import { logger } from '../../lib/util/logger';

export { config } from './config';

async function getVersionDataFromPlugin(plugin: any): Promise<[any, any]> {
  const hasDescribe = Object.hasOwnProperty.call(plugin, 'DESCRIBE');
  const hasVersion =
    hasDescribe && Object.hasOwnProperty.call(plugin.DESCRIBE, 'version?');
  const hasPkName =
    hasDescribe && Object.hasOwnProperty.call(plugin.DESCRIBE, 'pk_name?');

  if (hasVersion && hasPkName) {
    return [
      null,
      {
        name: plugin.DESCRIBE['pk_name?'],
        version: plugin.DESCRIBE['version?'],
      },
    ];
  }

  const hasLocation = Object.hasOwnProperty.call(plugin, 'LOCATION');
  const hasPath =
    hasLocation && Object.hasOwnProperty.call(plugin.LOCATION, 'path');
  if (!hasPath) {
    return [
      {
        code: 'UNABLE_TO_FETCH_PLUGIN_VERSION',
        message: `Unable to fetch version for plugin ${
          plugin.DESCRIBE.pk_name || plugin.DESCRIBE.alias
        }`,
      },
      null,
    ];
  }
  const pathToPkJson = nodePath.join(plugin.LOCATION.path, 'package.json');
  const pkJson = await import(pathToPkJson);
  return [null, { name: pkJson.name, version: pkJson.version }];
}

const versionString = (name: string, version: string) => `${name} @${version}`;

export async function version(args: any, ctx: any) {
  const { cwd } = ctx;
  const isProject = await isInProject(false, ctx);
  const pathToSelfPkJson = nodePath.join(__dirname, '../../../package.json');
  const pk = await import(pathToSelfPkJson);

  const { version: coreCliVersion, name: coreCliName } = pk;

  if (!isProject) {
    console.log(
      `Core CLI:\n\t${versionString(
        coreCliName,
        coreCliVersion
      )}\n\nPlugins:\n\tNot in a ymir project, no plugins to show`
    );
    return;
  }

  const ymirPath = helper.ymirProjectFolderPath(cwd);
  const [error, plugins] = await get.allPluginParsed(ymirPath);
  if (error) {
    logger.error('Unable to fetch plugin data', error);
    return;
  }

  try {
    const errors = [];
    const versionPlugin = await Promise.all(
      plugins.map(async (plugin: any) => {
        const [pluginVersionErr, pluginVersionData] =
          await getVersionDataFromPlugin(plugin);
        if (pluginVersionErr) {
          errors.push(pluginVersionErr);
        }
        return versionString(pluginVersionData.name, pluginVersionData.version);
      })
    );

    if (errors.length !== 0) {
      logger.error('Unable to fetch all plugin versions', errors);
    }
    const pluginVersionString = versionPlugin.join('\n\t');
    logger.info(
      `Core CLI:\n\t${versionString(
        coreCliName,
        coreCliVersion
      )}\n\nPlugins:\n\t${pluginVersionString}`
    );
  } catch (error) {
    logger.error('Unable to fetch plugin version', error);
    return;
  }
}
