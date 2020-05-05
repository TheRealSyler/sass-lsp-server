import { StingKeyObj } from '../utils';
import { AstParse, ParseDocument } from './parse';
import { promises, existsSync } from 'fs';
import { AstStringify } from './stringify';
import { SassNode, LineNode } from './nodes';
import { SassDiagnostic } from './diagnostics';
import { FileSettings } from '../defaultSettingsAndInterfaces';
import { findNode } from './utils';

export interface SassFile {
  body: LineNode[];
  diagnostics: SassDiagnostic[];
  settings: FileSettings;
}

export class AbstractSyntaxTree {
  files: StingKeyObj<SassFile> = {};

  async parse(document: ParseDocument, options?: Partial<FileSettings>) {
    this.files[document.uri] = await AstParse(document, this, options);
  }

  findNode(uri: string, line: number): SassNode | null {
    const file = this.files[uri];
    if (file) {
      return findNode(file.body, line);
    }
    return null;
  }

  // TODO add stringify range method
  async stringifyFile(uri: string, options?: Partial<FileSettings>) {
    if (await this.lookUpFile(uri, options)) {
      return AstStringify(this.files[uri], options).replace(/\n$/, '');
    }
    return '';
  }

  findVariable(uri: string, name: string) {
    const file = this.files[uri];
    if (file) {
      for (let i = 0; i < file.body.length; i++) {
        const node = file.body[i];
        if (node.type === 'variable' && node.value === name) {
          return node;
        }
      }
    }
    return null;
  }

  /**checks if the file exists and if the file is in this.files, if the file is not in file the file will be parsed. */
  async lookUpFile(uri: string, settings?: Partial<FileSettings>) {
    // TODO add check and test for circular dependencies
    if (this.files[uri]) {
      return true;
    }
    if (existsSync(uri)) {
      const text = (await promises.readFile(uri)).toString();

      this.files[uri] = await AstParse({ text, uri }, this, settings);
      return true;
    }
    return false;
  }
}
