import * as Chalk from 'chalk';
import { YmirError } from '../../types/response';

const chalk: any = Chalk;

export function logError(error: YmirError) {
  return console.error(`${chalk.red.bold(error.code)}: ${error.message}`);
}
