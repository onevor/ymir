/**
 * Helper methods to get plugin | resolver data from stack files
 */
import * as nodePath from 'path';

import * as check from '../resolve/check-install';
import * as fs from '../config/helper/fs';
import { StackSource, YmirPath, StackParsed } from '../types/stack';
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

export async function getAndValidateResolverAliasPluginPathMap(
  ymirPath: YmirPath,
  stackSource: StackSource
): Promise<[any | null, Record<string, string> | null]> {
  const stackFiles = [stackSource.stack, stackSource.defaultStack];
  const configFiles = [stackSource.stackConfig, stackSource.defaultStackConfig];

  const resolverAliases =
    await check.getAllResolverNamesFromStackAndConfigFiles(
      configFiles,
      stackFiles
    );

  const pluginPaths = resolverAliases.map((alias) =>
    nodePath.join(ymirPath, 'plugins', alias)
  );
  const missingPlugins = [];

  const pluginExists = await Promise.all(
    pluginPaths.map(async (path) => fs.exists(path))
  );
  pluginExists.forEach((exists, i) => {
    if (!exists) {
      missingPlugins.push(resolverAliases[i]);
    }
  });

  if (missingPlugins.length !== 0) {
    return [
      {
        code: 'PLUGIN_CONFIG_NOT_FOUND',
        nrOfMissing: missingPlugins.length,
        total: resolverAliases.length,
        missingPlugins,
      },
      null,
    ];
  }

  const map = resolverAliases.reduce((acc, alias, i) => {
    acc[alias] = pluginPaths[i];
    return acc;
  }, {});

  return [null, map];
}

export function getResolverConfigsFromConfigFile(content: string) {
  const [parsed] = trans.parseStackFile(content);
  const parsedEntries = Object.entries(parsed);
  const aliasConfig = {};
  parsedEntries.forEach(([key, value]) => {
    if (key.startsWith('RESOLVER_CONFIG')) {
      const alias =
        value.alias || key.split('RESOLVER_CONFIG_')[1].toLowerCase();
      aliasConfig[alias] = value;
    }
  });
  return aliasConfig;
}

export function mergeResolverConfAndMaps(
  aliasFileMap,
  aliasInstalledMap,
  aliasConfig,
  defaultAliasConfig
) {
  const aliases = Object.keys(aliasFileMap);
  const conf = {};

  aliases.forEach((alias) => {
    const file = aliasFileMap[alias];
    const installed = aliasInstalledMap[alias];
    const config = aliasConfig[alias] || defaultAliasConfig[alias];
    conf[alias] = {
      file,
      installed,
      config,
    };
  });
  return conf;
}

export async function getAndValidateResolverAliasInstalledPathMap(
  aliasPluginPathMap: Record<string, string>
) {
  const aliases = Object.keys(aliasPluginPathMap);
  const paths = Object.values(aliasPluginPathMap);
  const invalid = [];

  // get files, get path
  const pluginInstallPaths = await Promise.all(
    paths.map(async (path) => {
      try {
        const file = await fs.readFile(path, 'utf8');
        const [parsed] = trans.parseStackFile(file);
        const p = parsed.LOCATION ? parsed.LOCATION.path : null;
        const pExists = await fs.exists(p);
        return pExists ? p : null;
      } catch (error) {
        return null;
      }
    })
  );

  pluginInstallPaths.forEach((installPath, i) => {
    if (!installPath) {
      invalid.push(aliases[i]);
    }
  });

  if (invalid.length !== 0) {
    return [
      {
        code: 'INVALID_PLUGIN_INSTALLATION',
        nrOfInvalid: invalid.length,
        total: aliases.length,
        invalidPlugins: invalid,
      },
      null,
    ];
  }

  const map = aliases.reduce((acc, alias, i) => {
    acc[alias] = pluginInstallPaths[i];
    return acc;
  }, {});
  return [null, map];
}

/**
 * Create the resolver config object;
 * eg: {
 *  'aws': {
 *    file: '/Users/.../ymir/plugins/aws',
 *    installed: '/Users/.../node_modules/ymir-plugin-aws',
 *    config: { ... }
 *  },
 *  'azure': {
 *   file: '/Users/.../ymir/plugins/azure',
 *   ...
 *  },
 *  ...
 * }
 */
export async function configByStackSource(
  ymirPath: YmirPath,
  stackSource: StackSource
) {
  const { stackConfig, defaultStackConfig } = stackSource;
  /**
   * Create a mapping between the resolver alias and the path to the ymir plugin file;
   * eg: { 'aws': '/Users/.../ymir/plugins/aws' }
   */
  const [aliasPluginFileMapErr, aliasPluginFileMap] =
    await getAndValidateResolverAliasPluginPathMap(ymirPath, stackSource);

  if (aliasPluginFileMapErr) return [aliasPluginFileMapErr, null];

  /**
   * Create a mapping between the resolver alias and the path to the plugin installation;
   * eg: { 'aws': '/Users/.../node_modules/@onevor/ymir-plugin-aws' }
   */
  const [aliasInstalledMapErr, aliasInstalledMap] =
    await getAndValidateResolverAliasInstalledPathMap(aliasPluginFileMap);

  if (aliasInstalledMapErr) return [aliasInstalledMapErr, null];

  const resolverConfig = getResolverConfigsFromConfigFile(stackConfig);
  const resolverDefaultConfig =
    getResolverConfigsFromConfigFile(defaultStackConfig);

  const resolversCof = mergeResolverConfAndMaps(
    aliasPluginFileMap,
    aliasInstalledMap,
    resolverConfig,
    resolverDefaultConfig
  );

  return [null, resolversCof];
}

export function parseFiles(stackSource: StackSource): StackParsed {
  return {
    stack: trans.parseStackFile(stackSource.stack)[0],
    defaultStack: trans.parseStackFile(stackSource.defaultStack)[0],
    stackConfig: trans.parseStackFile(stackSource.stackConfig)[0],
    defaultStackConfig: trans.parseStackFile(stackSource.defaultStackConfig)[0],
  };
}
