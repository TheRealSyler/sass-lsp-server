import { SassDiagnostic } from './diagnostics';
import { SassNode, SassNodes } from './nodes';

export interface SassFile {
  body: SassNode[];
  diagnostics: SassDiagnostic[];
}

export function isUse(text: string) {
  return /^[\t ]*@use/.test(text);
}
export function isImport(text: string) {
  return /^[\t ]*@import/.test(text);
}

export function createSassNode<K extends keyof SassNodes>(values: SassNodes[K]) {
  return values;
}

// export function execGlobalRegex(regex: RegExp, text: string, func: (m: RegExpExecArray) => void) {
//   let m;
//   while ((m = regex.exec(text)) !== null) {
//     if (m.index === regex.lastIndex) {
//       regex.lastIndex++;
//     }
//     func(m);
//   }
// }
