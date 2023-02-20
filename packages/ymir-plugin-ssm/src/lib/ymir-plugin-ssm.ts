import * as nodePath from 'path';

import { SSM } from './ssm';
import { randomUUID } from 'crypto';

type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};

/**
 * Retrieve information about one or more parameters in a specific hierarchy.  Request results are returned on a best-effort basis. If you specify MaxResults in the request, the response includes information up to the limit specified. The number of items returned, however, can be between zero and the value of MaxResults. If the service reaches an internal limit while processing the results, it stops the operation and returns the matching values up to that point and a NextToken. You can specify the NextToken in a subsequent call to get the next set of results.
 *   getParametersByPath
 *
 * Get information about one or more parameters by specifying multiple parameter names.  To get information about a single parameter, you can use the GetParameter operation instead.
 *   getParameters
 *
 * Get information about a single parameter by specifying the parameter name.  To get information about more than one parameter at a time, use the GetParameters operation.
 *   getParameter
 *
 * Get information about a parameter. Request results are returned on a best-effort basis. If you specify MaxResults in the request, the response includes information up to the limit specified. The number of items returned, however, can be between zero and the value of MaxResults. If the service reaches an internal limit while processing the results, it stops the operation and returns the matching values up to that point and a NextToken. You can specify the NextToken in a subsequent call to get the next set of results.  If you change the KMS key alias for the KMS key used to encrypt a parameter, then you must also update the key alias the parameter uses to reference KMS. Otherwise, DescribeParameters retrieves whatever the original key alias was referencing.
 *    describeParameters
 *
 * Delete a list of parameters. After deleting a parameter, wait for at least 30 seconds to create a parameter with the same name.
 *    deleteParameters
 *
 * Delete a parameter from the system. After deleting a parameter, wait for at least 30 seconds to create a parameter with the same name.
 *   deleteParameter
 *
 * Get information about a parameter. Request results are returned on a best-effort basis. If you specify MaxResults in the request, the response includes information up to the limit specified. The number of items returned, however, can be between zero and the value of MaxResults. If the service reaches an internal limit while processing the results, it stops the operation and returns the matching values up to that point and a NextToken. You can specify the NextToken in a subsequent call to get the next set of results.  If you change the KMS key alias for the KMS key used to encrypt a parameter, then you must also update the key alias the parameter uses to reference KMS. Otherwise, DescribeParameters retrieves whatever the original key alias was referencing.
 *   describeParameters
 *
 */

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
  const { path } = props;
  const ssm = _getClient(ctx);
  await ssm.delete(path);
  return;
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
