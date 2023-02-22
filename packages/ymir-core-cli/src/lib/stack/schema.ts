export function getRequiredPropsForConfig(config: any) {
  // Need to change the transpiler, this does not work.
  // If a resolver has ha prop description, all description props will be marked as required
  // Should switch to toml soon
  const entries = Object.entries(config);
  const isResolverConf = (key: string) =>
    key.substring(0, 16) === 'RESOLVER_CONFIG_';
  const requiredProps = [
    'name',
    'alias',
    'path',
    'ymir_version',
    'project_version',
  ];

  entries.forEach(([key, value]) => {
    if (isResolverConf(key)) {
      const props = Object.keys(value);
      requiredProps.push(...props);
    }
  });

  return requiredProps;
}
