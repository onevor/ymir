import * as fs from '../helper/fs';
import * as parse from '../parser/transpiler';

export async function getYmirFileAsObject(
  ymirPath: string,
  relativePath: string,
  storeComment = false
) {
  const fileData = await fs.getFileFromYmir(ymirPath, relativePath);
  return parse.parseStackFile(fileData, storeComment);
}

export async function writeYmirFileFromObject(
  ymirPath: string,
  relativePath: string,
  data: Record<string, any>,
  comments: Record<string, any>,
  requiredProps?: string[]
) {
  const fileData = parse.transpileObjectToStack(data, comments, requiredProps);
  return fs.writeYmirFile(ymirPath, relativePath, fileData);
}
