/**
 * Helper to validate plugins:
 * this is now done all over the place.
 */
import * as StackT from '../types/stack';
import * as fs from '../config/helper/fs';
import * as get from './get-plugin';

export async function fileExistsByAlias(
  ymirPath: StackT.YmirPath,
  alias: string
) {
  const pluginPath = get.pluginFilePathByAlias(ymirPath, alias);
  const exists = await fs.exists(pluginPath);
  if (!exists) {
    return [
      {
        code: 'PLUGIN_CONFIG_NOT_FOUND',
        path: pluginPath,
        alias,
      },
      false,
    ];
  }
  return [null, true];
}

export async function byAlias(ymirPath: StackT.YmirPath, alias: string) {
  const pluginPath = get.pluginFilePathByAlias(ymirPath, alias);
  const [existsErr] = await fileExistsByAlias(ymirPath, alias);
  if (existsErr) return [existsErr, false];

  const [pluginDataErr, pluginData] = await get.pluginByAlias(ymirPath, alias);

  if (pluginDataErr) return [pluginDataErr, false];

  if (!pluginData.LOCATION || !pluginData.LOCATION.path) {
    return [
      {
        code: 'INVALID_PLUGIN_CONFIG',
        message: 'Missing install path in plugin config',
        path: pluginPath,
        alias,
      },
      false,
    ];
  }

  const installExists = await fs.exists(pluginData.LOCATION.path);

  if (!installExists) {
    return [
      {
        code: 'INVALID_PLUGIN_CONFIG',
        message: 'Plugin installed path does not exist',
        path: pluginPath,
        alias,
      },
      false,
    ];
  }

  return [null, true];
}
