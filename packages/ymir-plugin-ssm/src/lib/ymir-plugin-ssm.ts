/**
 * This is a mock plugin: I have yet to design the plugin structure.
 */

import { SSM } from './ssm';

type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};

type Properties = BaseProperties & { value: string };

let _client: SSM;
function _getClient(ctx: any): SSM {
  if (_client) {
    return _client;
  }
  _client = new SSM();
  return _client;
}

function _getDecrypt(props: BaseProperties, ctx: any) {
  const { config } = props;
  return config?.decrypt ? config.decrypt : true;
}

export async function _resolveOne(props: BaseProperties, ctx: any) {
  const { path } = props;
  const ssm = _getClient(ctx);
  const resolved = await ssm.get(path, _getDecrypt(props, ctx));
  return resolved;
}

export async function resolveOne(
  props: BaseProperties,
  ctx: any
): Promise<string> {
  const { key, path } = props;
  // TODO: need a vor logger, should be able to suppress this log;
  // console.info(`Resolving ${name} from ssm path: ${path}...`);
  try {
    const value = await _resolveOne(props, ctx);
    return value;
  } catch (err) {
    console.error(`Unable to resolve: ${key} from path: ${path}`, err);
    return null;
  }
}

export async function resolveAll(
  env: BaseProperties[],
  ctx: any
): Promise<[string | null, string | null][]> {
  const ssm = _getClient(ctx);
  const resolved = env.map(
    async (props): Promise<[string | null, string | null]> => {
      try {
        const value = await _resolveOne(props, ctx);
        return [props.key || null, value];
      } catch (err) {
        return [props.key || null, null];
      }
    }
  );

  return Promise.all(resolved);
}

export async function add(props: BaseProperties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}
export async function update(props: BaseProperties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}
export async function remove(props: BaseProperties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}
