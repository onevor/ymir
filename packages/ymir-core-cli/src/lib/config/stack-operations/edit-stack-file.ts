import * as helper from '../helper';

import * as trans from '../parser/transpiler';

export function getDestinationStackFromOpt(currentStack: string, opt: any) {
  if (opt.globalStack && opt.destinationStack) {
    throw new Error('Cannot specify both globalStack and destinationStack');
  }
  const optDestination = opt.globalStack ? 'default' : opt.destinationStack;
  return optDestination || currentStack;
}

/**
 * Feat to add:
 * - copy property from one stack to another
 *   - with override
 */
export async function addNewProperty(
  currentStack: string,
  projectPath: string,
  prop: any,
  opt: any
) {
  const stackName = getDestinationStackFromOpt(currentStack, opt);
  const { key } = prop;

  const content = { ...prop.content };
  const comments = {};

  if (prop.comments) {
    Object.assign(comments, prop.comments);
  }

  const [currentStackContent, currentStackComments] =
    await helper.getParsedStackData(projectPath, stackName, true);

  if (Object.hasOwnProperty.call(currentStackContent, key)) {
    throw new Error(`Key ${key} already exists in stack ${stackName}`);
  }

  currentStackContent[key] = content;
  currentStackComments[key] = comments;

  const transpiled = trans.transpileObjectToStack(
    currentStackContent,
    currentStackComments
  );

  return helper.writeStack(projectPath, stackName, transpiled);
}

export async function updateProperty(
  currentStack: string,
  projectPath: string,
  prop: any,
  opt: any
) {
  const stackName = getDestinationStackFromOpt(currentStack, opt);
  const { key } = prop;

  const content = { ...prop.content };

  const comment = {};

  if (prop.comment) {
    Object.assign(comment, prop.comment);
  }

  const [currentStackContent, currentStackComments] =
    await helper.getParsedStackData(projectPath, stackName, true);

  if (!Object.hasOwnProperty.call(currentStackContent, key)) {
    console.warn(
      `Tried to edit key ${key} from stack ${stackName}, but key does not exist.`
    );
    return;
  }

  currentStackContent[key] = content;
  currentStackComments[key] = comment;

  const transpiled = trans.transpileObjectToStack(
    currentStackContent,
    currentStackComments
  );

  return helper.writeStack(projectPath, stackName, transpiled);
}

export async function removeProperty(
  currentStack: string,
  projectPath: string,
  prop: any,
  opt: any
) {
  const stackName = getDestinationStackFromOpt(currentStack, opt);
  const { key } = prop;

  const [currentStackContent, comments] = await helper.getParsedStackData(
    projectPath,
    stackName,
    true
  );

  if (!Object.hasOwnProperty.call(currentStackContent, key)) {
    console.warn(
      `Tried to delete key ${key} from stack ${stackName}, but key does not exist.`
    );
    return;
  }

  delete currentStackContent[key];
  delete comments[key];

  const transpiled = trans.transpileObjectToStack(
    currentStackContent,
    comments
  );

  return helper.writeStack(projectPath, stackName, transpiled);
}
