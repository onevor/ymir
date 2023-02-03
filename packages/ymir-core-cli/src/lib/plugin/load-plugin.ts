/**
 * All calls to the plugins should happen here;
 */

export async function importEnvData(
  data: Record<string, string>,
  resolverConfig: any,
  resolverAlias: string,
  stackName: string
) {
  const hasConfig = Object.hasOwnProperty.call(resolverConfig, resolverAlias);
  if (!hasConfig) {
    return [
      {
        code: 'NOT_FOUND_PLUGIN_CONFIG',
        message: `Plugin config not found for alias: ${resolverAlias}`,
        alias: resolverAlias,
        stackName,
      },
      null,
    ];
  }
  const hasInstall = Object.hasOwnProperty.call(
    resolverConfig[resolverAlias],
    'installed'
  );
  if (!hasInstall) {
    return [
      {
        code: 'INVALID_PLUGIN_CONFIG',
        message: `Invalid plugin config for alias: ${resolverAlias}. missing installed path`,
        alias: resolverAlias,
        stackName,
      },
      null,
    ];
  }
  const config = resolverConfig[resolverAlias];
  const resolver = await import(resolverConfig[resolverAlias].installed);
  const payload = {
    data,
  };

  const pluginHasImport = Object.hasOwnProperty.call(resolver, 'importEnv');
  if (!pluginHasImport) {
    return [
      {
        code: 'INVALID_PLUGIN',
        message: 'Plugin does not support import',
        alias: resolverAlias,
        stackName,
      },
      null,
    ];
  }
  return resolver.importEnv(payload, config);
}
