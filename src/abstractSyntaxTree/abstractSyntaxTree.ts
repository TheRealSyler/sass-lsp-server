import { SassFile } from './utils';
import { SassASTOptions } from './nodes';
import { StingKeyObj } from '../utils';
import { ASTParser } from './parse';
import { promises } from 'fs';
import { ASTStringify } from './stringify';

export class AbstractSyntaxTree {
  files: StingKeyObj<SassFile> = {};

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

  async lookUpFile(uri: string, options: SassASTOptions) {
    // TODO add check and test for circular dependencies
    if (this.files[uri]) {
      return true;
    }

    const text = (await promises.readFile(uri)).toString();

    this.files[uri] = await new ASTParser(uri, options, this).parse(text);
    return true;
  }
  // TODO add parse line method
  async parseFile(text: string, uri: string, options: SassASTOptions) {
    this.files[uri] = await new ASTParser(uri, options, this).parse(text);
  }

  // TODO add stringify line method
  async stringifyFile(uri: string, options: SassASTOptions) {
    await this.lookUpFile(uri, options);
    return new ASTStringify().stringify(this.files[uri], options).replace(/\n$/, '');
  }
}
