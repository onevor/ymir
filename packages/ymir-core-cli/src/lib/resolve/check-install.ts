/**
 * TODO:
 * check that all resolvers needed is installed:
 *
 * 1. X need to get all config files:
 * 1.1 X get all default resolvers
 *
 * 2. X get all stack files
 * 2.2 X gel all resolvers
 *
 * 3. get all plugin files, that we have resolvers for
 *
 * 3.1 check that we have a file for each
 * 3.2 check that we have the path
 * 3.2.1 if no path, try to resolve it
 * 3.2.2 if resolved update
 * 3.2.3 if not resolved, throw error
 *        msg: unable to find, run npm install, or install resolver (in project or global)
 *        or manually add path to config (might create a command for this)
 */

import * as nodePath from 'path';

import * as stackHelper from '../config/helper';
import * as fs from '../config/helper/fs';
import * as file from '../config/file';
import * as trans from '../config/parser/transpiler';

export async function getAllConfigAndStackFiles(ymirPath: string) {
  const configFilesPromise = stackHelper.getAllFilesInYmirDir(
    ymirPath,
    'stack-config'
  );
  const stackFilesPromise = stackHelper.getAllFilesInYmirDir(
    ymirPath,
    'stacks'
  );

  const configFiles = await configFilesPromise;
  const stackFiles = await stackFilesPromise;

  return [configFiles, stackFiles];
}

export function getDefaultResolverAliasFromConfig(config: string) {
  const [parsed] = trans.parseStackFile(config);
  // TODO: validate that the content is valid;
  if (!Object.hasOwnProperty.call(parsed, 'DEFAULT_RESOLVER')) {
    return null;
  }

  return parsed.DEFAULT_RESOLVER.name;
}

export function getResolversFromStack(stack: string): string[] {
  const [parsed] = trans.parseStackFile(stack);
  const values = Object.values(parsed);
  const resolverAliases = [];

  values.forEach((value) => {
    if (Object.hasOwnProperty.call(value, 'resolver?')) {
      resolverAliases.push(value['resolver?']);
    }
  });

  return resolverAliases;
}

export function getResolverNamesFromAllStackConfigs(
  configs: string[]
): string[] {
  const resolvers = configs.map((conf) =>
    getDefaultResolverAliasFromConfig(conf)
  );
  return resolvers;
}

export function getResolversFromAllStacks(stacks: string[]): string[] {
  const resolvers = stacks.map((stack) => getResolversFromStack(stack));
  return resolvers.flat();
}

export function getAllResolverNamesFromStackAndConfigFiles(
  configFiles: string[],
  stackFiles: string[]
): string[] {
  const resolversFromConfig = getResolverNamesFromAllStackConfigs(configFiles);
  const resolversNamesFromConfig = resolversFromConfig.filter(Boolean);

  const resolverNamesFromStacks = getResolversFromAllStacks(stackFiles);
  return [
    ...new Set([...resolversNamesFromConfig, ...resolverNamesFromStacks]),
  ];
}

export function verifyPluginProps(plugin: any, pluginPath: string) {
  // if (!Object.hasOwnProperty.call(plugin, 'DESCRIBE') || !Object.hasOwnProperty.call(plugin.DESCRIBE, 'alias')) {
  //   return [
  //     false,
  //     `Invalid Plugin config; missing DESCRIBE: Pleas add "DESCRIBE:alias:[an alias name for plugin, that can be used to reference it]" to the plugin config at: ${pluginPath}`,
  //   ];
  // }
  if (
    !Object.hasOwnProperty.call(plugin, 'LOCATION') ||
    !Object.hasOwnProperty.call(plugin.LOCATION, 'path')
  ) {
    return [
      false,
      `Invalid Plugin config; missing LOCATION: Pleas add "LOCATION:path:[path to the installed plugin]" to the plugin config at: ${pluginPath}`,
    ];
  }
  return [true, null];
}

export async function verifyPluginInstall(
  cwd: string,
  plugin: any,
  pluginPath: string
) {
  const [validProps, propsError] = verifyPluginProps(plugin, pluginPath);

  if (!validProps) {
    return [false, propsError];
  }

  const { LOCATION, DESCRIBE } = plugin;
  // const
  // // Check if plugin in is installed;
  // const pluginExists = await fs.exists(LOCATION.path);

  // if (!pluginExists) {
  //   return [
  //     false,
  //     `Unable to locate installed plugin:
  //       Is node_modules installed? run 'npm i|ci' or install globally.
  //       or install plugin or manually edit path in plugin config at: ${pluginPath} to the correct path.
  //       `,
  //   ];
  // }

  // return [true, null];
}

export async function verifyPlugin(
  cwd: string,
  plugin: any,
  pluginPath: string
) {
  const [validProps, propsError] = verifyPluginProps(plugin, pluginPath);
  if (!validProps) {
    return [false, propsError];
  }

  const { LOCATION } = plugin;
  const pluginExists = await fs.exists(LOCATION.path);

  if (!pluginExists) {
    return [
      false,
      `Unable to locate installed plugin:
        Is node_modules installed? run 'npm i|ci' or install globally.
        or install plugin or manually edit path in plugin config at: ${pluginPath} to the correct path.
        `,
    ];
  }

  return [true, null];
}

export async function validatePluginFileExist(
  ymirPath: string,
  pluginAlias: string
) {
  const pluginPath = nodePath.join(ymirPath, 'plugins', pluginAlias);
  return fs.exists(pluginPath);
}

export async function validatePluginsExist(
  ymirPath: string,
  aliases: string[]
) {
  const promises = aliases.map((alias) =>
    validatePluginFileExist(ymirPath, alias)
  );
  const results = await Promise.all(promises);
  const missing = [];
  results.forEach((result, i) => {
    if (!result) {
      missing.push(aliases[i]);
    }
  });

  if (missing.length !== 0) {
    return [
      {
        code: 'PLUGIN_CONFIG_NOT_FOUND',
        nrOfMissing: missing.length,
        total: aliases.length,
        missing,
      },
      false,
    ];
  }
  return [null, true];
}

export async function getPluginPath(ymirPath: string, pluginAlias: string) {
  const pluginRelPath = nodePath.join('plugins', pluginAlias);
  const [pluginData] = await file.getYmirFileAsObject(ymirPath, pluginRelPath);

  if (!pluginData) {
    return [
      {
        code: 'PLUGIN_CONFIG_NOT_FOUND',
        pluginAlias,
      },
      false,
    ];
  }

  if (!Object.hasOwnProperty.call(pluginData, 'LOCATION')) {
    return [
      {
        code: 'PLUGIN_CONFIG_MISSING_LOCATION',
        pluginAlias,
      },
      false,
    ];
  }

  if (!Object.hasOwnProperty.call(pluginData.LOCATION, 'path')) {
    return [
      {
        code: 'PLUGIN_CONFIG_MISSING_LOCATION_PATH',
        pluginAlias,
      },
      false,
    ];
  }
  return [null, pluginData.LOCATION.path];
}

export async function getPluginPathsMap(
  ymirPath: string,
  pluginAliases: string[]
) {
  const promises = pluginAliases.map((alias) => getPluginPath(ymirPath, alias));
  const results = await Promise.all(promises);
  const errors = [];
  const paths = {};
  results.forEach((result, index) => {
    if (result[0]) {
      errors.push(result[0]);
    } else {
      paths[pluginAliases[index]] = result[1];
    }
  });

  if (errors.length !== 0) {
    return [errors, paths];
  }
  return [null, paths];
}

export async function validatePathMap(
  ymirPath: string,
  map: Record<string, string>
) {
  const aliases = Object.keys(map);
  const paths = Object.values(map);

  const pathsExists = await Promise.all(paths.map((path) => fs.exists(path)));

  const missing = [];
  pathsExists.forEach((exists, i) => {
    if (!exists) {
      missing.push(aliases[i]);
    }
  });

  if (missing.length !== 0) {
    return [
      {
        code: 'PLUGIN_INSTALLED_PATH_INVALID',
        message: 'Plugin path is invalid',
        invalidPathsForAliases: missing,
        nrOfInvalidPaths: missing.length,
        total: aliases.length,
      },
      false,
    ];
  }
  return [null, true];
}
