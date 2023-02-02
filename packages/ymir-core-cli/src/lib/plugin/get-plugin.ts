/**
 * Helper methods to get plugin | resolver data from stack files
 */
import * as nodePath from 'path';

import * as check from '../resolve/check-install';
import * as fs from '../config/helper/fs';
import { StackSource, YmirPath } from '../types/stack';
import * as trans from '../config/parser/transpiler';

type ErrorResponse = {
  code: string;
  message: string;
  orgError?: Error;
};

export const pluginFilePathByAlias = (ymirPath: YmirPath, alias: string) =>
  nodePath.join(ymirPath, 'plugins', alias);

export function defaultResolver(
  stacksSource: StackSource
): [ErrorResponse | null, string | null] {
  const { stackConfig, defaultStackConfig } = stacksSource;
  const defaultResolver =
    check.getDefaultResolverAliasFromConfig(stackConfig) ||
    check.getDefaultResolverAliasFromConfig(defaultStackConfig);

  if (!defaultResolver) {
    return [
      {
        code: 'NO_DEFAULT_RESOLVER',
        message: 'No default resolver found in config files',
      },
      null,
    ];
  }
  return [null, defaultResolver];
}

export async function pluginFileByAlias(
  ymirPath: YmirPath,
  alias: string
): Promise<[ErrorResponse | null, string | null]> {
  const pluginPath = pluginFilePathByAlias(ymirPath, alias);
  try {
    const pluginFile = await fs.readFile(pluginPath, 'utf8');
    return [null, pluginFile];
  } catch (error) {
    console.error('Unable to get plugin file', error);
    return [
      {
        code: 'UNABLE_TO_GET_PLUGIN_FILE',
        message: 'Unable to get plugin file',
        orgError: error,
      },
      null,
    ];
  }
}

export async function pluginByAlias(
  ymirPath: YmirPath,
  alias: string
): Promise<[ErrorResponse | null, any]> {
  const [pluginFileErr, pluginFile] = await pluginFileByAlias(ymirPath, alias);
  if (pluginFileErr) return [pluginFileErr, null];
  const [parsed] = trans.parseStackFile(pluginFile);
  return [null, parsed];
}

// TODO: get default resolver
// TODO: get resolver config
// TODO: get all resolvers
// TODO: get full resolver config;
