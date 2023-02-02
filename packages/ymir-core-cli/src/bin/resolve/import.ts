import * as nodePath from 'path';

import * as commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';

import * as fs from '../../lib/config/helper/fs';
import { isInProject } from '../lib/index';
import * as help from '../lib/help';

function getEnvPath(args: any, ctx: any) {
  const { cwd } = ctx;
  const { path } = args;

  if (path.substring(0, 6) === '/Users') {
    return path;
  }

  return nodePath.join(cwd, path);
}

export async function getEnvData(args: any, ctx: any) {
  const path = getEnvPath(args, ctx);
  try {
    const data = await fs.readFile(path, 'utf8');
    return [null, dotenv.parse(data)];
  } catch (error) {
    console.error('Error reading env file', error);
    return [
      {
        code: 'UNABLE_TO_READ_FILE',
        message: 'Unable to read env file',
        path,
      },
      null,
    ];
  }
}

export async function importStack(args: any, ctx: any) {
  const { cwd } = ctx;
  await isInProject(true, ctx);

  const def = [{ name: 'path', alias: 'p', type: String }, help.def];
  const opt = commandLineArgs(def, { argv: args });

  const [envDataErr, envData] = await getEnvData(opt, ctx);
  if (envDataErr) {
    console.error('Unable to read env file', envDataErr);
    return;
  }

  console.log('envData', envData);
  return;
}
