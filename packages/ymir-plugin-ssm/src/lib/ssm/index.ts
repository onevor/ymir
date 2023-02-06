/**
 * A simple proxy for the AWS SSM SDK
 */

import { SSM as SSMSdk } from 'aws-sdk';

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export class SSM {
  private sdk: SSMSdk;

  constructor(region: string) {
    this.sdk = new SSMSdk({ region });
  }

  async simpleGet(name: string, decryption = false) {
    const param = {
      Name: name,
      WithDecryption: decryption,
    };

    const result = await this.sdk.getParameter(param).promise();

    if (!result || !result.Parameter) {
      throw new Error('Parameter not found');
    }

    return result.Parameter.Value;
  }

  async get(name: string, decryption = false, retries = 3, count = 0) {
    try {
      const result = await this.simpleGet(name, decryption);
      return result;
    } catch (error) {
      if (count < retries) {
        const iteration = count + 1;
        await sleep(iteration * iteration * 500);

        return this.get(name, decryption, retries, iteration);
      }
      throw error;
    }
  }

  create(
    name: string,
    value: string,
    type?: string,
    description?: string,
    overwrite = true
  ) {
    const param = {
      Name: name,
      Value: value,
      Description: description || '',
      Type: type || 'SecureString',
      Overwrite: overwrite,
    };

    return this.sdk.putParameter(param).promise();
  }

  delete(name: string) {
    return this.sdk.deleteParameter({ Name: name }).promise();
  }
}
