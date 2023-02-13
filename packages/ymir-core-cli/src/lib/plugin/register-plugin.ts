/**
 * Automatically register all plugins.
 *
 */

import * as nodePath from 'path';

import { execCommand } from '../cmd';
import * as fs from '../config/helper/fs';
import * as trans from '../config/parser/transpiler';

const pluginPrefix = 'ymir-plugin-';

export async function getNodeModulesPath(global = false) {
  const baseCmd = 'npm root';
  const cmd = global ? `${baseCmd} -g` : baseCmd;
  const path = await execCommand(cmd);
  return path.trim();
}

export async function lsNodeModules(path: string) {
  return fs.readdir(path);
}

export async function crawlNodeModules(pathPrefix: string, crawl: string[]) {
  const pkgs = [];
  const subDir = await Promise.all(crawl.map((c) => fs.readdir(c)));
  subDir.forEach((dir, index) => {
    dir.forEach((d) => {
      const fullPath = nodePath.join(crawl[index], d);
      if (d.substring(0, 12) === pluginPrefix) {
        pkgs.push(fullPath);
      }
    });
  });
  return pkgs;
}

export async function locatePlugins(pathPrefix: string) {
  const dir = await lsNodeModules(pathPrefix);
  const pluginPaths = [];
  const crawl = [];
  dir.forEach((d) => {
    const fullPath = nodePath.join(pathPrefix, d);
    if (d.substring(0, 12) === pluginPrefix) {
      pluginPaths.push(fullPath);
    }
    if (d.substring(0, 1) === '@') {
      crawl.push(fullPath);
    }
  });

  const crawled = await crawlNodeModules(pathPrefix, crawl);

  return [...pluginPaths, ...crawled];
}

export async function extractPluginFromPkJson(path: string) {
  const pk = await import(path);
  const { devDependencies, dependencies } = pk;
  const deps = Object.keys({ ...devDependencies, ...dependencies });
  // TODO: clean this up;
  const plugins = deps
    .map((d) => {
      if (d.substring(0, 1) === '@') {
        const plugin = d.split('/')[1];
        if (plugin.substring(0, 12) === pluginPrefix) {
          return nodePath.join(path, '..', 'node_modules', d);
        }
      }
      if (d.substring(0, 12) === pluginPrefix) {
        return nodePath.join(path, '..', 'node_modules', d);
      }
      return false;
    })
    .filter(Boolean);
  return plugins;
}

export async function crawlProjectForPkJson(
  cwd: string,
  pkJsonPaths = [],
  depth = 0,
  maxDepth = 5
) {
  const paths = [...pkJsonPaths];
  const pkPath = nodePath.join(cwd, 'package.json');
  const exists = await fs.exists(pkPath);
  if (exists) {
    paths.push(pkPath);
  }
  if (depth < maxDepth) {
    const parent = nodePath.join(cwd, '..');
    return crawlProjectForPkJson(parent, paths, depth + 1, maxDepth);
  }
  return paths;
}

export async function crawlAndLocatePlugins(cwd: string) {
  const pkJsonPaths = await crawlProjectForPkJson(cwd);
  return pkJsonPaths.reduce(async (acc, p) => {
    const res = await acc;
    const resolve = await extractPluginFromPkJson(p);
    return [...res, ...resolve];
  }, Promise.resolve([]));
}

export async function fullPluginResolve(cwd: string) {
  const projectRoot = await getNodeModulesPath();
  const globalRoot = await getNodeModulesPath(true);

  const pluginsRoot = await locatePlugins(projectRoot);
  const pluginsGlobal = await locatePlugins(globalRoot);
  const pluginsCrawl = await crawlAndLocatePlugins(cwd);

  const pluginLocations = [
    ...new Set([...pluginsRoot, ...pluginsGlobal, ...pluginsCrawl]),
  ];

  return pluginLocations;
}

// TODO: move to plugin get
export async function getPluginInfo(path: string) {
  const plugin = await import(path);
  const hasInfo = plugin && Object.hasOwnProperty.call(plugin, 'info');
  if (!hasInfo) {
    return [
      {
        code: 'PLUGIN_MISSING_METHOD',
        message: `Plugin ${path} is missing the info method`,
      },
      null,
    ];
  }
  return [null, await plugin.info()];
}

export function createPluginFileData(info: any) {
  const data = {
    DESCRIBE: {
      alias: info.alias,
      pk_name: info.name,
      pk_version: info.version,
    },
    LOCATION: {
      path: info.installPath,
      install_cmd: `npm i -D ${info.name}`,
    },
  };
  return trans.transpileObjectToStack(data, {}, ['alias', 'path']);
}

export async function registerPlugins(
  ymirPath: string,
  pluginPaths: string[],
  overwrite = false
) {
  const plugins = await pluginPaths.reduce(
    async (acc, path): Promise<{ error: any; result: any; files: any }> => {
      const res = await acc;
      const [error, info] = await getPluginInfo(path);
      if (error) res.error.push(error);
      res.result.push(info);
      const fileData = createPluginFileData(info);
      const filePath = nodePath.join(ymirPath, 'plugins', info.alias);
      res.files.push([filePath, fileData]);
      return res;
    },
    Promise.resolve({ error: [], result: [], files: [] })
  );

  const { files } = plugins;
  const fileWrites = files.map(async ([path, data]) => {
    if (!overwrite) {
      const exists = await fs.exists(path);
      if (exists) {
        console.log(`Plugin ${path} already exists, skipping`);
        return null;
      }
    }
    return fs.writeFile(path, data);
  });

  await Promise.all(fileWrites);
}
