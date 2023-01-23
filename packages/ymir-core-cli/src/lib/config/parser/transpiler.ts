/**
 * TODO: Make this a proper parser
 * Switch out the one in helper with this.
 */

const lex = {
  valueComment: /;[^\n]*/g,
  valueAndComment: /[^;]+/g,
  valueAndCommentSplit: /;(?=\s)/,
  key: /^\[([A-Z_]+)\]/,
  isKey: /^\[[A-Z_]+\]/,
  isProp: /^  [a-z]+[?:]?:/,
  isPropNotGreedy: /(.*?):/,
};

export function mdValueToObject(rawValue: string) {
  const [valR, commentR] = rawValue.split(lex.valueAndCommentSplit);
  const val = valR.trim();
  const comment = commentR ? commentR.trim() : '';
  try {
    return [JSON.parse(val), comment];
  } catch (error) {
    return [val, comment];
  }
}

export function parseStackFile(
  content: string,
  storeComment = false
): [Record<string, any>, Record<string, any>] {
  const lines = content.split('\n');
  const parsed = {};
  const comment = {};
  let currentKey;
  lines.forEach((line) => {
    if (line.match(lex.isKey)) {
      currentKey = line.match(lex.key)[1];
      parsed[currentKey] = {};
      if (storeComment) comment[currentKey] = {};
    } else if (line.match(lex.isPropNotGreedy)) {
      const [key, value] = line.trim().split(':');
      const [val, valComment] = mdValueToObject(value);
      parsed[currentKey][key] = val;
      if (storeComment) comment[currentKey][key] = valComment;
    }
  });
  return [parsed, comment];
}

export function transpileObjectToStack(
  data: any,
  comments?: any,
  requiredProps?: string[]
) {
  const requiredSubKeys = requiredProps ? requiredProps : ['path'];
  const entries = Object.entries(data);
  const stackDocList = entries.map(([key, value]) => {
    const header = `[${key}]\n`;
    const body = Object.entries(value);
    const bodyText = body.map(([subKey, subValue]) => {
      let com = '';
      if (comments && comments[key] && comments[key][subKey]) {
        com = `; ${comments[key][subKey].trim()}`;
      }
      let keyString = `${subKey}:`;
      if (
        !requiredSubKeys.includes(subKey) &&
        subKey.substring(subKey.length - 1) !== '?'
      ) {
        keyString = `${subKey}?:`;
      }
      return `  ${keyString} ${subValue}${com}\n`;
    });
    return `${header}${bodyText.join('')}\n`;
  });
  return `${stackDocList.join('').trim()}\n`;
}
