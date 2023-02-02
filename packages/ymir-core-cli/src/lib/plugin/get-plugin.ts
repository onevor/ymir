/**
 * Helper methods to get plugin | resolver data from stack files
 */

import * as check from '../resolve/check-install';
import { StackSource } from '../types/stack';

type ErrorResponse = {
  code: string;
  message: string;
};

export function defaultResolver(
  stacksSource: StackSource
): [ErrorResponse | null, string | null] {
  const { stackConfig, defaultStackConfig } = stacksSource;
  const defaultResolver =
    check.getDefaultResolverAliasFromConfig(stackConfig) ||
    check.getDefaultResolverAliasFromConfig(defaultStackConfig);

  if (!defaultResolver) {
    return [
      {
        code: 'NO_DEFAULT_RESOLVER',
        message: 'No default resolver found in config files',
      },
      null,
    ];
  }
  return [null, defaultResolver];
}

// TODO: get default resolver
// TODO: get resolver config
// TODO: get all resolvers
// TODO: get full resolver config;
