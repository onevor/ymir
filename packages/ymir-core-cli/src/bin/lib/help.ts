import * as Chalk from 'chalk';

const chalk: any = Chalk;

export const missingCommandError = chalk.red('No command specified: ');

export function getUsageText(method: string, args?: string) {
  return `${chalk.green('ymir')} ${chalk.greenBright(method)} ${
    args ? chalk.blueBright(args) : ''
  }`;
}

export const def = { name: 'help', alias: 'h', type: Boolean };

export function logMain(methods: string[], header?: string) {
  const help = [];
  if (header) {
    help.push(header);
    help.push('\n\n');
  }
  help.push('Methods:\n');
  methods.forEach((method) => {
    help.push(`\t${getUsageText(method)}\n`);
  });

  help.push(`\nGet help with a method:\n`);
  help.push(
    `\t${chalk.green('ymir')} ${chalk.greenBright('<method>')} ${chalk.magenta(
      '-h'
    )}\n`
  );
  console.log(help.join(''));
}

export function log(
  def: Record<string, any>[],
  description?: string,
  usage?: string
) {
  const help = [];
  if (description) {
    help.push(description);
  }

  if (usage) {
    help.push(`\n\nUsage:\n\t${usage}`);
  }

  help.push('\n\nOptions:\n');
  const flags = [];

  def.forEach((opt) => {
    let flag = `-${opt.alias}|--${opt.name}`;
    // TODO: what types do we have?
    if (opt.type === String) {
      flag = `[${flag} ${chalk.green('<value>')}]`;
    } else {
      flag = `[${flag}]`;
    }

    if (opt.description) {
      flag = `${flag}\n\t\t"${chalk.blue(opt.description)}"`;
    }

    flags.push(flag);
  });

  help.push(`\t${flags.join('\n\t')}`);

  console.log(help.join(''));
}
