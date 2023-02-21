import { logger } from '../../lib/util/logger';

export async function config(args: any, ctx: any) {
  return logger.info('config');
}
