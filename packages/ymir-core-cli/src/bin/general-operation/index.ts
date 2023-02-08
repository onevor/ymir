import * as nodePath from 'path';

import * as helper from '../../lib/config/helper';
import { isInProject } from '../lib/index';
import * as get from '../../lib/plugin/get-plugin';

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
  await isInProject(true, ctx);
  const pathToSelfPkJson = nodePath.join(__dirname, '../../../package.json');
  const pk = await import(pathToSelfPkJson);

  const ymirPath = helper.ymirProjectFolderPath(cwd);

  const { version: coreCliVersion, name: coreCliName } = pk;
  const [error, plugins] = await get.allPluginParsed(ymirPath);
  if (error) {
    console.error('Unable to fetch plugin data', error);
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
      console.error('Unable to fetch all plugin versions', errors);
    }
    const pluginVersionString = versionPlugin.join('\n\t');
    console.log(
      `Core CLI:\n\t${versionString(
        coreCliName,
        coreCliVersion
      )}\n\nPlugins:\n\t${pluginVersionString}`
    );
  } catch (error) {
    console.error('Unable to fetch plugin version', error);
    return;
  }
}
