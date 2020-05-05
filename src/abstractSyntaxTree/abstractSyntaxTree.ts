import { StingKeyObj } from '../utils';
import { AstParse } from './parse';
import { promises } from 'fs';
import { AstStringify } from './stringify';
import { TextDocumentItem } from 'vscode-languageserver';
import { extname } from 'path';
import { SassNode } from './nodes';
import { SassDiagnostic } from './diagnostics';
import { FileSettings } from '../server';

export interface SassFile {
  body: SassNode[];
  diagnostics: SassDiagnostic[];
  settings: FileSettings;
}

export class AbstractSyntaxTree {
  files: StingKeyObj<SassFile> = {};

  // TODO add parse line method
  async parseFile(document: TextDocumentItem, options?: Partial<FileSettings>) {
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
    await this.lookUpFile(uri, options);
    return AstStringify(this.files[uri], options).replace(/\n$/, '');
  }

  findVariable(uri: string, name: string) {
    const file = this.files[uri];
    if (file && file.body) {
      for (let i = 0; i < file.body.length; i++) {
        const node = file.body[i];
        if (node.type === 'variable' && node.value === name) {
          return node;
        }
      }
    }
    return null;
  }

  async lookUpFile(uri: string, options?: Partial<FileSettings>) {
    // TODO add check and test for circular dependencies
    if (this.files[uri]) {
      return true;
    }

    const text = (await promises.readFile(uri)).toString();

    this.files[uri] = await AstParse(
      { languageId: extname(uri), text, uri, version: 0 },
      this,
      options
    );
    return true;
  }
}
