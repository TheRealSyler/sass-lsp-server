import { TextDocumentItem } from 'vscode-languageserver';
import { FileSettings } from '../defaultSettingsAndInterfaces';

export const defaultTestFileSettings: FileSettings = {
  insertSpaces: true,
  tabSize: 2,
};

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function createDocumentItem(text: string, uri: string): TextDocumentItem {
  return {
    languageId: 'sass',
    text,
    uri,
    version: 0,
  };
}
