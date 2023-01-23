import { readFile } from 'fs/promises';

import { parse as dotParse } from 'dotenv';

export type StringUnknownPair = [string, unknown];

export async function getDotFile(
  path: string,
  parse = false
): Promise<string | Record<string, unknown>> {
  const data = await readFile(path, 'utf-8');

  if (parse) {
    return dotParse(data);
  }

  return data;
}

export function entriesToEnvFile(entries: StringUnknownPair[]): string {
  const file = entries.map(([key, value]) => `${key}=${value}`).join('\n');
  return `${file}\n`;
}

export function appendEnvToFile(
  env: string,
  key: string,
  value: unknown
): string {
  return `${env.trim()}\n${key}=${value}\n`;
}

export function removeEnvFromFile(
  env: Record<string, unknown>,
  key: string
): string {
  const copy = { ...env };
  if (!copy[key]) {
    console.warn(`Key ${key} not found in env file`);
    const entries: StringUnknownPair[] = Object.entries(copy);
    return entriesToEnvFile(entries);
  }
  delete copy[key];
  const entries: StringUnknownPair[] = Object.entries(copy);
  return entriesToEnvFile(entries);
}

export function updateValueFile(
  env: Record<string, unknown>,
  key: string,
  value: unknown
): string {
  const copy = { ...env };
  if (!copy[key]) {
    console.warn(`Key ${key} not found in env file`);
    const entries: StringUnknownPair[] = Object.entries(copy);
    return entriesToEnvFile(entries);
  }
  copy[key] = value;
  const entries: StringUnknownPair[] = Object.entries(copy);
  return entriesToEnvFile(entries);
}
