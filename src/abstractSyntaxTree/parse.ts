import { createSassNode, isUse, isImport, SassFile } from './utils';
import { SassNode, SassNodes, NodeValue, SassASTOptions } from './nodes';
import {
  getDistance,
  isProperty,
  isSelector,
  isVar,
  isMixin,
  isHtmlTag,
  isEmptyOrWhitespace,
  isAtExtend,
  isSingleLineComment,
  isBlockCommentStart,
  isBlockCommentEnd,
  isInclude,
  isFontFace,
  isInterpolatedProperty,
} from 'suf-regex';
import { resolve } from 'path';
import { addDotSassToPath } from '../utils';
import { AbstractSyntaxTree } from './abstractSyntaxTree';
import { SassDiagnostic, createSassDiagnostic, createRange } from './diagnostics';

const importAtPathRegex = /^[\t ]*(@import|@use)[\t ]*['"]?(.*?)['"]?[\t ]*([\t ]+as.*)?$/;

interface ASTScope {
  /**Stores references to the nodes in the current scope.
   *
   * ```sass
   *   .class // [.class node].
   *     margin: 20px
   *     .class2  // [.class node, .class2 node]
   *       padding: 20px
   *   .class3 // [.class3 node]
   * ``` */
  selectors: (SassNodes['selector'] | SassNodes['mixin'])[];
  /**Stores all the variables available in the current scope.
   *
   * ```sass
   *    $var: 1px // [[$var node]]
   *    .class
   *      $var2: 2px // [[$var node], [$var2 node]]
   *      &:hover
   *        $var3: 3px // [[$var node], [$var2 node], [$var3 node]]
   *    .class2
   *      $var4: 4px // [[$var node], [$var4 node]]
   * ``` */
  variables: SassNodes['variable'][][];
  /**Stores all the imports available in the current scope, work's same as `scope.variables`. */
  imports: (SassNodes['import'] | SassNodes['use'])[][];
}

interface ASTParserCurrentContext {
  index: number;
  /**text of the current line. */
  line: string;
  /**node type. */
  type: keyof SassNodes;
  /**distance to first char in spaces. */
  distance: number;
  /**line indentation level.*/
  level: number;
  /**not null if currently in block comment. */
  blockCommentNode: SassNodes['blockComment'] | null;
  isLastBlockCommentLine: boolean;
}

export class ASTParser {
  /**Stores all nodes. */
  nodes: SassNode[] = [];

  diagnostics: SassDiagnostic[] = [];

  scope: ASTScope = {
    selectors: [],
    variables: [],
    imports: [],
  };
  /**Stores information about the current line. */
  current: ASTParserCurrentContext = {
    index: -1,
    distance: 0,
    line: '',
    type: 'emptyLine',
    level: 0,
    blockCommentNode: null,
    isLastBlockCommentLine: false,
  };

  constructor(public uri: string, public options: SassASTOptions, public ast: AbstractSyntaxTree) {}

  async parse(text: string): Promise<SassFile> {
    const lines = text.split('\n');
    let canPushAtUseOrAtForwardNode = true;
    for (let index = 0; index < lines.length; index++) {
      this.current.index = index;
      this.current.line = lines[index];
      this.current.type = this.getLineType(this.current.line);
      this.current.distance = getDistance(this.current.line, this.options.tabSize);
      this.current.level = Math.round(this.current.distance / this.options.tabSize);

      if (this.current.type !== 'use') {
        canPushAtUseOrAtForwardNode = false;
      }
      switch (this.current.type) {
        case 'blockComment':
          {
            let value = this.current.line.replace(/^[\t ]*/, ' ').trimEnd();
            if (!this.current.blockCommentNode) {
              this.current.blockCommentNode = createSassNode<'blockComment'>({
                body: [],
                level: this.current.level,
                line: this.current.index,
                type: 'blockComment',
              });
              this.pushNode(this.current.blockCommentNode);
              value = value.trimLeft();
            }

            this.current.blockCommentNode.body.push({
              line: this.current.index,
              value,
            });
            if (this.current.isLastBlockCommentLine) {
              this.current.blockCommentNode = null;
              this.current.isLastBlockCommentLine = false;
            }
          }
          break;
        case 'selector':
          {
            const node = createSassNode<'selector'>({
              body: [],
              level: this.getMinLevel(),
              line: index,
              type: this.current.type,
              value: this.parseExpression(
                this.current.line.trimStart(),
                this.current.distance,
                true
              ),
            });

            this.pushNode(node);

            this.limitScope();

            this.scope.selectors.push(node);
          }
          break;
        case 'mixin':
          {
            const { args, value, mixinType } = this.parseMixin(this.current.line);
            const node = createSassNode<'mixin'>({
              body: [],
              level: this.getMinLevel(),
              line: index,
              type: this.current.type,
              value,
              args,
              mixinType,
            });

            this.pushNode(node);

            this.limitScope();

            this.scope.selectors.push(node);
          }
          break;

        case 'property':
          {
            const { value, body } = this.parseProperty(this.current.line, false);
            this.scope.selectors[this.scope.selectors.length - 1].body.push(
              createSassNode<'property'>({
                body,
                level: this.getPropLevel(),
                line: index,
                type: this.current.type,
                value,
              })
            );
          }
          break;

        case 'variable':
          {
            const { value, body } = this.parseProperty(this.current.line, true);
            const node = createSassNode<'variable'>({
              body: body,
              level: this.getMinLevel(),
              line: index,
              type: this.current.type,
              value,
            });
            this.pushNode(node);
          }
          break;

        case 'import':
          {
            const path = this.current.line.replace(importAtPathRegex, '$2');
            const uri = resolve(this.uri, '../', addDotSassToPath(path));
            const clampedLevel = this.getMinLevel();

            const node = createSassNode<'import'>({
              uri,
              level: clampedLevel,
              line: index,
              type: this.current.type,
              value: path,
            });
            this.pushNode(node);

            await this.ast.lookUpFile(uri, this.options);
          }
          break;
        case 'use':
          {
            const clampedLevel = this.getMinLevel();
            if (canPushAtUseOrAtForwardNode) {
              // TODO ADD @use with functionality
              const path = this.current.line.replace(importAtPathRegex, '$2');
              const uri = resolve(this.uri, '../', addDotSassToPath(path));
              let namespace: string | null = this.current.line
                .replace(/(.*?as |@use)[\t ]*['"]?.*?([*\w-]*?)['"]?[\t ]*$/, '$2')
                .trim();
              namespace = namespace === '*' ? null : namespace;

              const node = createSassNode<'use'>({
                uri,
                line: index,
                namespace,
                type: this.current.type,
                value: path,
              });
              this.pushNode(node);

              await this.ast.lookUpFile(uri, this.options);
            } else {
              this.diagnostics.push(
                createSassDiagnostic(
                  '@useNotTopLevel',
                  createRange(index, this.current.distance, this.current.line.length)
                )
              );
              this.pushNode(
                createSassNode<'comment'>({
                  level: clampedLevel,
                  line: index,
                  type: 'comment',
                  value: '// '.concat(this.current.line.trimLeft()),
                })
              );
            }
          }
          break;

        case 'extend':
          {
            this.pushNode(
              createSassNode<'extend'>({
                line: this.current.index,
                type: 'extend',
                level: this.getPropLevel(),
                value: this.current.line.replace(/^[\t ]*@extend/, '').trim(),
              })
            );
          }
          break;
        case 'include':
          {
            this.pushNode(
              createSassNode<'include'>({
                line: this.current.index,
                type: 'include',
                level: this.getPropLevel(),
                value: this.current.line.replace(/^[\t ]*(@include|\+)/, '').trim(),
                includeType: this.current.line.replace(/^[\t ]*(@include|\+)/, '$1') as any,
              })
            );
          }
          break;

        case 'emptyLine':
          {
            this.current.distance = this.scope.selectors.length * this.options.tabSize;
            this.current.level = this.scope.selectors.length;
            this.pushNode(
              createSassNode<'emptyLine'>({ line: this.current.index, type: 'emptyLine' })
            );
          }
          break;

        case 'comment':
          {
            this.pushNode(
              createSassNode<'comment'>({
                level: this.getMinLevel(),
                line: index,
                type: 'comment',
                value: this.current.line.trimLeft(),
              }),
              false
            );
          }
          break;
        case 'literal':
          {
            this.pushNode(
              createSassNode<'literal'>({
                type: 'literal',
                line: this.current.index,
                value: this.current.line,
              })
            );
          }
          break;

        default:
          //TODO Handle default case ?
          //throw
          console.log(
            `\x1b[38;2;255;0;0;1mAST: PARSE DEFAULT CASE\x1b[m Line: ${this.current.line} Type: ${this.current.type} Index: ${index}`
          );
      }
    }

    return {
      body: this.nodes,
      diagnostics: this.diagnostics,
    };
  }

  private getPropLevel(): number {
    return Math.min(Math.max(this.current.level, 1), this.scope.selectors.length);
  }
  private getMinLevel() {
    return Math.min(this.current.level, this.scope.selectors.length);
  }

  /**Removes all nodes that should not be accessible from the current scope. */
  private limitScope() {
    if (this.scope.selectors.length > this.current.level) {
      this.scope.selectors.splice(this.current.level);
      this.scope.variables.splice(Math.max(this.current.level, 1));
      this.scope.imports.splice(Math.max(this.current.level, 1));
    }
  }

  private pushNode(node: SassNode, pushDiagnostics = true) {
    // TODO EXTEND DIAGNOSTIC, invalid indentation, example, (tabSize: 2) ' .class'
    if (this.current.distance < this.options.tabSize || this.scope.selectors.length === 0) {
      this.nodes.push(node);
    } else if (this.current.level > this.scope.selectors.length) {
      if (pushDiagnostics) {
        this.diagnostics.push(
          createSassDiagnostic(
            'invalidIndentation',
            createRange(this.current.index, this.current.distance, this.current.line.length),
            this.scope.selectors.length,
            this.options.tabSize,
            this.options.insertSpaces
          )
        );
      }
      this.scope.selectors[this.scope.selectors.length - 1].body.push(node);
    } else {
      this.scope.selectors[this.current.level - 1].body.push(node);
    }

    if (node.type === 'variable') {
      if (this.scope.variables[this.current.level]) {
        this.scope.variables[this.current.level].push(node);
      } else {
        this.scope.variables.push([node]);
      }
    } else if (node.type === 'import' || node.type === 'use') {
      if (this.scope.imports[this.current.level]) {
        this.scope.imports[this.current.level].push(node);
      } else {
        this.scope.imports.push([node]);
      }
    }
  }

  /**Parse the values of a property or variable declaration. */
  private parseProperty<R extends boolean>(
    line: string,
    stringVal: R
  ): { value: R extends true ? string : NodeValue[]; body: NodeValue[] } {
    const split = /^[\t ]*(.*?):(.*)/.exec(line)!;

    const value = split[1];
    const rawExpression = split[2];

    return {
      value: (stringVal ? value : this.parseExpression(value, this.current.distance)) as any,
      body: this.parseExpression(rawExpression, value.length + 1 + this.current.distance),
    };
  }

  private parseExpression(expression: string, startOffset: number, selectorMode = false) {
    let token = '';
    const body: NodeValue[] = [];

    const expressionNodes: SassNodes['expression'][] = [];
    let level = 0;
    let i = 0;
    let currentType: '"' | "'" | '//' | null = null;
    /**Keeps a space at the start of the token if in selectorMode*/
    let addSpace = false;

    const pushExpressionNode = (node: NodeValue) => {
      if (level === 0) {
        body.push(node);
      } else {
        expressionNodes[level - 1].body.push(node);
      }
    };

    const pushToken = (value: string) => {
      if (selectorMode && addSpace && value) {
        value = ' '.concat(value);
      }
      if (/^[.\w-]*\$/.test(value)) {
        const [, namespace, val] = /^(.*?)\.?(\$.*)/.exec(value)!;
        pushExpressionNode(
          createSassNode<'variableRef'>({
            type: 'variableRef',
            value,
            ref: this.getVarRef(val, namespace || null, startOffset + i - value.length),
          })
        );
      } else if (value) {
        pushExpressionNode(
          createSassNode<'literal'>({ type: 'literal', value })
        );
      }
      addSpace = false;
    };
    for (i; i < expression.length; i++) {
      const char = expression[i];
      if (currentType) {
        // the char can never equal // thats why you can never escape an inline comment.
        if (char === currentType) {
          currentType = null;
        }
        token += char;
        if (i === expression.length - 1) {
          i++; // i is used to measure the current offset, so 1 needs to be added on the last loop iteration.
          pushToken(token.trimEnd());
        }
      } else if (char === '"') {
        token += char;
        currentType = '"';
      } else if (char === "'") {
        token += char;
        currentType = "'";
      } else if (char === '/' && expression[i + 1] === '/') {
        pushToken(token);
        token = ' //';
        i++; // skip comment start
        currentType = '//';
      } else if (char === '#' && expression[i + 1] === '{') {
        i++; // skip open bracket

        const node = createSassNode<'expression'>({
          type: 'expression',
          body: [],
          expressionType: 'interpolated',
        });

        if (expressionNodes.length > level) {
          expressionNodes.splice(level, expressionNodes.length - level);
        }
        expressionNodes.push(node);
        pushExpressionNode(node);
        level++;

        token = '';
      } else if (char === ' ') {
        pushToken(token);
        token = '';
        addSpace = true;
      } else if (char === '(') {
        const node = createSassNode<'expression'>({
          type: 'expression',
          body: [],
          expressionType: 'func',
          funcName: token,
        });

        if (expressionNodes.length > level) {
          expressionNodes.splice(level, expressionNodes.length - level);
        }

        expressionNodes.push(node);
        pushExpressionNode(node);
        level++;

        token = '';
      } else if (char === ')') {
        pushToken(token);
        token = '';
        level--;
      } else if (char === '}') {
        pushToken(token);
        token = '';
        level--;
      } else if (i === expression.length - 1) {
        i++; // i is used to measure the current offset, so 1 needs to be added on the last loop iteration.
        pushToken(token + char);
      } else {
        token += char;
      }
    }

    return body;
  }

  private parseMixin(
    line: string
  ): {
    value: string;
    args: SassNodes['mixin']['args'];
    mixinType: SassNodes['mixin']['mixinType'];
  } {
    const split = /^([\t ]*(@mixin|=)[\t ]*([-_\w]*)[\t ]*)(\((.*)\))?/.exec(line)!;

    const offset = split[1].length;
    const mixinType = split[2] as SassNodes['mixin']['mixinType'];
    const value = split[3];
    const rawArgs = split[5];
    const args: SassNodes['mixin']['args'] = [];
    let expression = '';
    let argName = '';
    let isArgName = true;
    let quote: '"' | "'" | null = null;

    // TODO ADD DIAGNOSTICS, duplicate argument Names
    if (rawArgs) {
      for (let i = 0; i < rawArgs.length; i++) {
        const char = rawArgs[i];

        const isLastChar = i === rawArgs.length - 1;
        if (isArgName) {
          if (char === ':') {
            isArgName = false;
          } else if (char === ',' || isLastChar) {
            if (isLastChar) {
              argName += char;
            }

            args.push({ value: argName, body: null });
            argName = '';
            isArgName = true;
          } else if (char !== ' ') {
            argName += char;
          }
        } else if (quote) {
          if (char === quote) {
            quote = null;
          }
          expression += char;
          if (isLastChar) {
            args.push({
              value: argName,
              body: this.parseExpression(expression, offset + i + 1 - (expression.length - 1)),
            });
          }
        } else if (char === '"') {
          expression += char;
          quote = '"';
        } else if (char === "'") {
          expression += char;
          quote = "'";
        } else if (char === ',' || isLastChar) {
          if (isLastChar) {
            expression += char;
          }

          args.push({
            value: argName,
            body: this.parseExpression(expression, offset + i + 1 - (expression.length - 1)),
          });
          expression = '';
          argName = '';
          isArgName = true;
        } else {
          expression += char;
        }
      }
    }

    return { value, args, mixinType };
  }

  private getVarRef(
    name: string,
    namespace: null | string,
    offset: number
  ): SassNodes['variableRef']['ref'] {
    const varNode: SassNodes['variable'] | null | undefined = this.scope.variables
      .flat()
      .find((v) => v.value === name);
    if (varNode) {
      return { uri: this.uri, line: varNode.line };
    }

    const mixinVar = this.findVariableInMixinArgs(name);
    if (mixinVar) {
      return mixinVar;
    }
    const importVar = this.findVariableInImports(name, namespace);
    if (importVar) {
      return importVar;
    }

    this.diagnostics.push(
      createSassDiagnostic(
        'variableNotFound',
        createRange(this.current.index, offset, offset + name.length),
        name
      )
    );
    return null;
  }

  private findVariableInMixinArgs(name: string): SassNodes['variableRef']['ref'] {
    const selectors = this.scope.selectors;

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      if (selector.type === 'mixin') {
        for (let i = 0; i < selector.args.length; i++) {
          const arg = selector.args[i];
          if (arg.value === name) {
            return { line: selector.line, uri: this.uri };
          }
        }
      }
    }
    return null;
  }

  private findVariableInImports(
    name: string,
    namespace: null | string
  ): SassNodes['variableRef']['ref'] {
    const imports = this.scope.imports.flat();

    for (let i = 0; i < imports.length; i++) {
      const importNode = imports[i];

      if (importNode.type === 'use' && importNode.namespace !== namespace) {
        continue;
      }
      const varNode = this.ast.findVariable(importNode.uri, name);
      if (varNode) {
        return { uri: importNode.uri, line: varNode.line };
      }
    }

    return null;
  }

  private getLineType(line: string): keyof SassNodes {
    const isInterpolatedProp = isInterpolatedProperty(line);
    if (this.current.blockCommentNode) {
      if (isBlockCommentEnd(line)) {
        this.current.isLastBlockCommentLine = true;
      }
      return 'blockComment';
    } else if (isEmptyOrWhitespace(line)) {
      return 'emptyLine';
    } else if (isBlockCommentStart(line)) {
      return 'blockComment';
    } else if ((isSelector(line) || isHtmlTag(line) || isFontFace(line)) && !isInterpolatedProp) {
      return 'selector';
    } else if (isProperty(line) || isInterpolatedProp) {
      return 'property';
    } else if (isVar(line)) {
      return 'variable';
    } else if (isUse(line)) {
      return 'use';
    } else if (isImport(line)) {
      return 'import';
    } else if (isMixin(line)) {
      return 'mixin';
    } else if (isAtExtend(line)) {
      return 'extend';
    } else if (isInclude(line)) {
      return 'include';
    } else if (isSingleLineComment(line)) {
      return 'comment';
    }
    return 'literal';
  }
}
