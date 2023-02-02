import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';

import { StackSource, StackParsed } from '../../lib/types/stack';

import * as helper from '../../lib/config/helper';
import * as fs from '../../lib/config/helper/fs';
import * as trans from '../../lib/config/parser/transpiler';
import * as check from '../../lib/resolve/check-install';
import * as resolverLib from '../../lib/resolve/lib/resolver-operations/resolve-stack';
import * as getPlugin from '../../lib/plugin/get-plugin';

import { isInProject } from '../lib/index';
import * as help from '../lib/help';

import { entriesToEnvFile } from '../../lib/dotfile';

async function getStackAndDefault(
  ymirPath: string,
  relStackPath: string,
  relDefaultPath: string
) {
  // TODO: I can return the promise here to speed things up.
  const stackProm = await fs.getFileFromYmir(ymirPath, relStackPath);
  const defaultProm = await fs.getFileFromYmir(ymirPath, relDefaultPath);
  return [stackProm, defaultProm];
}

// TODO: this should standardized and dried up.
function getRelativePaths(stackName: string) {
  const stackDir = 'stacks';
  const stackConfigDir = 'stack-config';
  const defaultFileName = 'default';

  return {
    stack: nodePath.join(stackDir, stackName),
    defaultStack: nodePath.join(stackDir, defaultFileName),
    config: nodePath.join(stackConfigDir, stackName),
    defaultConfig: nodePath.join(stackConfigDir, defaultFileName),
  };
}

async function getStackAndConfig(
  ymirPath: string,
  stackName: string
): Promise<StackSource> {
  const relPaths = getRelativePaths(stackName);
  const [stack, defaultStack] = await getStackAndDefault(
    ymirPath,
    relPaths.stack,
    relPaths.defaultStack
  );
  const [stackConfig, defaultStackConfig] = await getStackAndDefault(
    ymirPath,
    relPaths.config,
    relPaths.defaultConfig
  );
  return { stack, defaultStack, stackConfig, defaultStackConfig };
}

export async function getAndValidateResolverAliasPluginPathMap(
  ymirPath: string,
  stackFiles: string[],
  configFiles: string[]
): Promise<[any | null, Record<string, string> | null]> {
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
export async function getResolverConfig(
  ymirPath: string,
  stackSource: StackSource
) {
  const { stack, defaultStack, stackConfig, defaultStackConfig } = stackSource;
  /**
   * Create a mapping between the resolver alias and the path to the ymir plugin file;
   * eg: { 'aws': '/Users/.../ymir/plugins/aws' }
   */
  const [aliasPluginFileMapErr, aliasPluginFileMap] =
    await getAndValidateResolverAliasPluginPathMap(
      ymirPath,
      [stack, defaultStack],
      [stackConfig, defaultStackConfig]
    );

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

export async function exportStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [{ name: 'stack', alias: 's', type: String }, help.def];
  const opt = commandLineArgs(def, { argv: args });

  if (opt.help) {
    return help.log(def, 'Export a stack to a .env file');
  }

  const ymirPath = await helper.ymirProjectFolderPath(cwd);
  const stackName = opt.stack || (await fs.getCurrentStackName(ymirPath));
  const stackExists = await fs.stackExists(cwd, stackName);

  if (!stackExists) {
    console.error(`Stack ${stackName} does not exist`);
    return;
  }

  // const [stack, defaultStack, stackConfig, defaultStackConfig] =
  const stackSource = await getStackAndConfig(ymirPath, stackName);
  const [defaultResolverErr, defaultResolver] =
    getPlugin.defaultResolver(stackSource);

  if (defaultResolverErr) {
    console.error(defaultResolverErr.message, defaultResolverErr);
    return;
  }

  const [resolverConfErr, resolverConf] = await getResolverConfig(
    ymirPath,
    stackSource
  );

  if (resolverConfErr) {
    console.error('Unable to create resolver config: ', resolverConfErr);
    return;
  }

  const data = parseFiles(stackSource);

  const resolved = await resolverLib.resolveStack(
    ymirPath,
    data,
    defaultResolver,
    resolverConf
  );

  const dotFileData = entriesToEnvFile(resolved);
  const fileConf = data.stackConfig.FILE || data.defaultStackConfig.FILE;

  if (!fileConf) {
    console.error('No FILE config found in stack or default stack');
    return;
  }

  const filePath = nodePath.join(ymirPath, '../', fileConf.path, fileConf.name);
  return fs.writeFile(filePath, dotFileData);
}
