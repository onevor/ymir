import * as nodePath from 'path';

import { SSM } from './ssm';
import { randomUUID } from 'crypto';

type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};

type Properties = BaseProperties & { value: string };

let _client: SSM;
function _getClient(ctx: any): SSM {
  if (!ctx.config || !ctx.config.region) {
    throw new Error(`No region provided in config:
      In your stack config file add:
      "
      [RESOLVER_CONFIG_SSM]
        alias: ssm
        region: AWS-region-to-use
      "
    `);
  }

  const { region } = ctx.config;

  if (_client) {
    return _client;
  }
  _client = new SSM(region);
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
  const { path, value } = props;
  const ssm = _getClient(ctx);
  await ssm.create(path, value);
  return;
}
export async function update(props: BaseProperties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}
export async function remove(props: BaseProperties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}

function _createPathFromKeyAndStackName(key: string, stackName?: string) {
  const name = key.toLowerCase().trim().split('_').join('/');
  const path = `/${stackName || 'default'}/${
    randomUUID().split('-')[0]
  }/${name}`;
  return path;
}

export async function importEnv(
  payload: any,
  ctx: any
): Promise<[any, Properties[] | null]> {
  const { data } = payload;
  const entries = Object.entries(data) as [string, string][];
  const properties: Properties[] = entries.map(([key, value]) => {
    const path = _createPathFromKeyAndStackName(key, payload.stackName);
    const props: Properties = {
      key,
      value,
      path,
    };
    return props;
  });

  try {
    await Promise.all(properties.map((props) => add(props, ctx)));
  } catch (error) {
    return [
      {
        code: 'UNABLE_TO_IMPORT_ENV',
        message: 'Unable to import env',
        orgError: error,
      },
      properties,
    ];
  }

  return [null, properties];
}

export async function info() {
  const pk = await import('../../package.json');
  const installPath = nodePath.join(__dirname, '../../');
  const { name, version } = pk;
  return {
    name,
    version,
    alias: 'ssm',
    requiredConfig: ['region'],
    installPath,
  };
}
