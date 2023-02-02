export type FilePath = string;

export type YmirPath = FilePath;

// A path to a resource in the YMirPath.
export type YmirRelativePath = FilePath;

export type StackName = string;

export type StackSource = {
  stack: string;
  defaultStack: string;
  stackConfig: string;
  defaultStackConfig: string;
};

export type StackSourcePaths = {
  stack: FilePath;
  defaultStack: FilePath;
  stackConfig: FilePath;
  defaultStackConfig: FilePath;
};

// TODO: need to type this;
export type StackParsed = {
  stack: any;
  defaultStack: any;
  stackConfig: any;
  defaultStackConfig: any;
};
