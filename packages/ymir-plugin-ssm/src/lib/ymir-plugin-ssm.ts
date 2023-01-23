/**
 * This is a mock plugin: I have yet to design the plugin structure.
 */

import { SSM } from './ssm';

export async function _resolve(ssm: SSM, path: string, decrypt = true) {
  const resolved = await ssm.get(path, decrypt);
  return resolved;
}

export async function resolveOne(
  name: string,
  properties: any,
  decrypt = true
) {
  const ssm = new SSM();
  const { path } = properties;
  // TODO: need a vor logger, should be able to suppress this log;
  // console.info(`Resolving ${name} from ssm path: ${path}...`);
  try {
    const value = await _resolve(ssm, path, decrypt);
    return [name, value];
  } catch (err) {
    console.error(`Unable to resolve: ${name} from path: ${path}`, err);
    return [name, null];
  }
}

export async function resolveAll(envs: Record<string, any>, decrypt = true) {
  const ssm = new SSM();
  const entries = Object.entries(envs);
  const resolved = await Promise.all(
    entries.map(async ([name, properties]) => {
      const { path } = properties;
      // console.info(`Resolving ${name} from ssm path: ${path}...`);
      try {
        const value = await _resolve(ssm, path, decrypt);
        return [name, value];
      } catch (err) {
        return [name, null];
      }
    })
  );

  // console.info('Resolved all ssm variables');
  return resolved;
}

export async function addEnv(key: string, path: string, value: any) {
  console.error('Not implemented');
  return key;
}
export async function removeEnv(key: string, path: string) {
  console.error('Not implemented');
  return key;
}
export async function updateEnv(key: string, path: string, value: any) {
  console.error('Not implemented');
  return key;
}
