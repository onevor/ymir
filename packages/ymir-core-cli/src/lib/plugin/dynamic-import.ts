import { YmirPath } from '../types/stack';
import * as get from './get-plugin';

export async function byInstallPath(pluginInstallPath: string) {
  // TODO: need some validation here;
  const plugin = await import(pluginInstallPath);
  return plugin;
}

export async function byAlias(ymirPath: YmirPath, alias: string) {
  const [err, pluginData] = await get.pluginByAlias(ymirPath, alias);
  if (err) return [err, null];
  const pluginInstallPath = pluginData.LOCATION.path;
  try {
    const plugin = await import(pluginInstallPath);
    return [null, plugin];
  } catch (error) {
    return [
      {
        code: 'PLUGIN_IMPORT_ERROR',
        message: 'Error importing plugin',
        path: pluginInstallPath,
        alias,
        originalError: error,
      },
      null,
    ];
  }
}
