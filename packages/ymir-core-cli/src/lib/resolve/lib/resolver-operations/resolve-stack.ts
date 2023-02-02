import { StackParsed } from '../../../types/stack';

export async function resolvePropMap(
  ymirPath: string,
  propMap: any,
  resolverConfig: any
) {
  const entries: [string, any][] = Object.entries(propMap);
  return entries.reduce(async (acc, [key, value]) => {
    const result = await acc;
    const conf = resolverConfig[key];
    const resolver = await import(conf.installed);
    const res = await resolver.resolveAll(value, conf);
    return [...result, ...res];
  }, Promise.resolve([]));
}

export async function resolveStack(
  ymirPath: string,
  data: StackParsed,
  defaultResolver: string,
  resolverConfig: any
) {
  const resolverPropMap = {};
  const resolvers = Object.keys(resolverConfig);
  resolvers.forEach((name) => {
    resolverPropMap[name] = [];
  });

  delete data.stack.DESCRIBE;
  delete data.defaultStack.DESCRIBE;

  // TODO: Need to make sure that stack data overrides default stack data;
  const stack = { ...data.defaultStack, ...data.stack };

  const stackEntries: [string, any][] = Object.entries(stack);
  stackEntries.forEach(([key, value]) => {
    if (Object.hasOwnProperty.call(value, 'resolver?')) {
      const resolver = value['resolver?'];
      resolverPropMap[resolver].push({
        key,
        path: value.path,
        value: value.value,
        config: value,
      });
    } else {
      resolverPropMap[defaultResolver].push({
        key,
        path: value.path,
        value: value.value,
        config: value,
      });
    }
  });

  return resolvePropMap(ymirPath, resolverPropMap, resolverConfig);
}
