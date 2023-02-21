import * as Chalk from 'chalk';
import { YmirError } from '../../types/response';

const chalk: any = Chalk;

export function logError(error: YmirError) {
  return console.error(`${chalk.red.bold(error.code)}: ${error.message}`);
}

const logMsgFormat = (msg) => msg;

type ConsoleLike = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

export const logger: ConsoleLike = {
  log: (message: string, ...args: any[]) =>
    console.log(logMsgFormat(message), ...args),
  info: (message: string, ...args: any[]) =>
    console.info(logMsgFormat(message), ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(logMsgFormat(message), ...args),
  error: (message: string, ...args: any[]) =>
    console.error(logMsgFormat(message), ...args),
};
