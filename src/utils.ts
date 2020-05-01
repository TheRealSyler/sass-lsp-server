export type StingKeyObj<T> = {
  [key: string]: T;
};
export function addDotSassToPath(path: string) {
  if (!/\.sass$/.test(path)) {
    path = path.concat('.sass');
  }
  return path;
}

export function Pluralize(text: string, amount: number) {
  return amount === 1 ? text : `${text}s`;
}
