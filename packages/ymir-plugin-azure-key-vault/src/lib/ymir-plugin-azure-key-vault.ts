import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

type BaseProperties = {
  path: string;
  key?: string;
  value?: string;
  config?: any;
};

type Properties = BaseProperties & { value: string };

let _client: SecretClient;
function _getClient(ctx: any) {
  const { vault_name } = ctx.config;
  const url = `https://${vault_name}.vault.azure.net`;

  if (_client) {
    return _client;
  }
  const credential = new DefaultAzureCredential();
  _client = new SecretClient(url, credential);
  return _client;
}

async function _resolveOne(
  props: BaseProperties,
  ctx: any
): Promise<KeyVaultSecret> {
  const client = _getClient(ctx);
  return client.getSecret(props.path);
}

// TODO: wrap all calls and create standard ymir errors;

export async function add(props: Properties, ctx: any): Promise<void> {
  const client = _getClient(ctx);
  await client.setSecret(props.path, props.value);
  return;
}

// TODO: update the value;
// Need to delete an create, no update value in the API; only props
export async function update(props: Properties, ctx: any): Promise<void> {
  throw new Error('Not implemented');
}

export async function remove(props: BaseProperties, ctx: any): Promise<void> {
  const client = _getClient(ctx);
  const deletePoller = await client.beginDeleteSecret(props.path);
  await deletePoller.pollUntilDone();
  await client.purgeDeletedSecret(props.path);
  return;
}

export async function resolveOne(
  props: BaseProperties,
  ctx: any
): Promise<string | null> {
  try {
    const secret = await _resolveOne(props, ctx);
    return secret.value || null;
  } catch (error) {
    console.error(
      `Unable to resolve: ${props.key} from path: ${props.path}`,
      error
    );
    return null;
  }
}

export async function resolveAll(
  env: BaseProperties[],
  ctx: any
): Promise<[string | null, string | null][]> {
  const resolved = env.map(
    async (props): Promise<[string | null, string | null]> => {
      try {
        const value = await resolveOne(props, ctx);
        return [props.key || null, value];
      } catch (error) {
        return [props.key || null, null];
      }
    }
  );

  return Promise.all(resolved);
}
