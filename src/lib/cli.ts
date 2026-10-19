/** Prints one JSON document on stdout and exits. */
export function emit(value: unknown, code = 0): never {
  process.stdout.write(`${JSON.stringify(value)}\n`);
  process.exit(code);
}

export function takeFlag(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const value = argv[i + 1];
  argv.splice(i, value === undefined ? 1 : 2);
  return value;
}

export function takeSwitch(argv: string[], flag: string): boolean {
  const i = argv.indexOf(flag);
  if (i < 0) return false;
  argv.splice(i, 1);
  return true;
}
