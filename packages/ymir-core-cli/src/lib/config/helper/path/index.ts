import * as nodePath from 'path';

export const ymirProjectFolderPath = (projectPath: string) =>
  nodePath.join(projectPath, '.ymir');

export function getYmirProjectPath(
  cwd: string,
  relativePath?: string,
  absolutePath?: string
) {
  if (absolutePath) {
    return absolutePath;
  }
  return relativePath ? nodePath.join(cwd, relativePath) : cwd;
}

export const getYmirFilePath = (
  ymirPath: string,
  dir: string,
  stackName: string
) => nodePath.join(ymirPath, dir, stackName);

export const getStackPath = (projectPath: string, stackName: string) =>
  nodePath.join(
    getYmirFilePath(ymirProjectFolderPath(projectPath), 'stacks', stackName)
  );

export const getStackConfigPath = (projectPath: string, stackName: string) =>
  nodePath.join(
    getYmirFilePath(
      ymirProjectFolderPath(projectPath),
      'stack-config',
      stackName
    )
  );
