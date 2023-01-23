export async function resolvePropMap(
  ymirPath: string,
  propMap: any,
  resolverMap: any
) {
  const entries: [string, any][] = Object.entries(propMap);
  return entries.reduce(async (acc, [key, value]) => {
    await acc;
    const resolverInstallPath = resolverMap[key];
    const resolver = await import(resolverInstallPath);
    return resolver.resolveAll(value);
  }, Promise.resolve({}));
}

export async function resolveStack(
  ymirPath: string,
  stackData: any,
  defaultStackData: any,
  defaultResolver: string,
  resolverMap: Record<string, string>
) {
  const resolverPropMap = {};
  const resolvers = Object.keys(resolverMap);
  resolvers.forEach((name) => {
    resolverPropMap[name] = {};
  });

  delete stackData.DESCRIBE;
  delete defaultStackData.DESCRIBE;

  // TODO: Need to make sure that stack data overrides default stack data;
  const stack = { ...defaultStackData, ...stackData };

  const stackEntries: [string, any][] = Object.entries(stack);
  stackEntries.forEach(([key, value]) => {
    if (Object.hasOwnProperty.call(value, 'resolver?')) {
      const resolver = value['resolver?'];
      resolverPropMap[resolver][key] = value;
    } else {
      resolverPropMap[defaultResolver][key] = value;
    }
  });

  return resolvePropMap(ymirPath, resolverPropMap, resolverMap);
}
