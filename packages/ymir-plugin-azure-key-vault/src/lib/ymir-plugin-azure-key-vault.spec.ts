import * as keyVault from './ymir-plugin-azure-key-vault';

/**
 * TODO:
 * should mock the azure key vault client
 * for now you need the az cli to be logged in to run the tests;
 */

/**
 * Key vault is so slow....
 */
jest.setTimeout(300000);

describe('Ymir plugin azure key vault', () => {
  const vaultName = 'ymir-test-vault';
  const ctx = {
    config: {
      vault_name: vaultName,
    },
  };
  const envs = [
    { key: 'PORT', path: 'dev-test-port', value: '3000' },
    { key: 'DEBUG', path: 'dev-test-debug', value: 'true' },
    { key: 'TEST_VAR', path: 'dev-test-testVar', value: 'Some test value' },
  ];
  const cleanUp = [...envs];
  beforeAll(async () => {
    await Promise.all(envs.map((env) => keyVault.add(env, ctx)));
  });
  afterAll(async () => {
    await Promise.all(cleanUp.map((env) => keyVault.remove(env, ctx)));
  });
  it('should get a secret', async () => {
    const env = envs[0];
    const value = await keyVault.resolveOne(env, ctx);
    expect(value).toBe(env.value);
  });
  it('should get all secrets', async () => {
    const resolved = await keyVault.resolveAll(envs, ctx);
    expect(resolved).toEqual(envs.map((env) => [env.key, env.value]));
  });
  it('should add a secret', async () => {
    const props = {
      key: 'ADD_PROP',
      path: 'dev-test-add-prop',
      value: 'addProp',
    };
    cleanUp.push(props);
    const result = await keyVault.add(props, ctx);
    expect(result).toBeUndefined();
    const value = await keyVault.resolveOne(props, ctx);
    expect(value).toBe(props.value);
  });
  it('should should delete', async () => {
    const props = {
      key: 'REMOVE_PROP',
      path: 'dev-test-remove-prop',
      value: 'removeProp',
    };
    const result = await keyVault.add(props, ctx);
    expect(result).toBeUndefined();

    const value = await keyVault.resolveOne(props, ctx);
    expect(value).toBe(props.value);
    const removeResult = await keyVault.remove(props, ctx);
    expect(removeResult).toBeUndefined();

    try {
      const postRemove = await keyVault.resolveOne(props, ctx);
    } catch (error) {
      expect(error).toBeDefined();
      return;
    }
    throw new Error('Should have thrown an error');
  });
});
