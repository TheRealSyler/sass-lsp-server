export interface LSPServerSettings {
  maxNumberOfProblems: number;
}
export type FileSettings = {
  tabSize: number;
  insertSpaces: boolean;
};
export const defaultFileSettings: FileSettings = {
  insertSpaces: false,
  tabSize: 2,
};
export const defaultLSPServerSettings: LSPServerSettings = {
  maxNumberOfProblems: 1000,
};
