import { createSassNode, isUse, isImport, sliceNodes } from './utils';
import { SassNodes, LineNode, ValueNode } from './nodes';
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
import { AbstractSyntaxTree, SassFile } from './abstractSyntaxTree';
import { SassDiagnostic, createSassDiagnostic, createRange } from './diagnostics';
import { FileSettings, defaultFileSettings } from '../defaultSettingsAndInterfaces';

const importAtPathRegex = /^[\t ]*(@import|@use)[\t ]*['"]?(.*?)['"]?[\t ]*([\t ]+as.*)?$/;

export interface ParseScope {
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

type PartialDocument = {
  startLine: number;
  endLine: number;
  text: string;
  uri: string;
  /**Nodes before the startLine. */
  nodes: LineNode[];
};

type FullDocument = {
  text: string;
  uri: string;
};

export type ParseDocument = FullDocument | PartialDocument;
// TODO Implement ability to parse a range, (using ParsePartialDocument)
export async function AstParse(
  document: ParseDocument,
  ast: AbstractSyntaxTree,
  _settings?: Partial<FileSettings>
): Promise<SassFile> {
  const settings = { ...defaultFileSettings, ...(_settings || {}) };
  const { scope, diagnostics, nodes, context, lines, isPartial } = declareParseVariables(document);

  let canPushAtUseOrAtForwardNode = true;
  // console.log(JSON.stringify(declareParseVariables(document), null, 2));
  for (context.index; context.index < lines.length; context.index++) {
    context.line = lines[context.index];
    context.type = getLineType(context.line);
    context.distance = getDistance(context.line, settings.tabSize);
    context.level = Math.round(context.distance / settings.tabSize);

    if (context.type !== 'use') {
      canPushAtUseOrAtForwardNode = false;
    }
    switch (context.type) {
      case 'blockComment':
        {
          let value = context.line.replace(/^[\t ]*/, ' ').trimEnd();
          if (!context.blockCommentNode) {
            context.blockCommentNode = createSassNode<'blockComment'>({
              body: [],
              level: context.level,
              line: context.index,
              type: 'blockComment',
            });
            pushNode(context.blockCommentNode);
            value = value.trimLeft();
          }

          context.blockCommentNode.body.push({
            line: context.index,
            value,
            type: 'blockCommentContent',
          });
          if (context.isLastBlockCommentLine) {
            context.blockCommentNode = null;
            context.isLastBlockCommentLine = false;
          }
        }
        break;
      case 'selector':
        {
          const node = createSassNode<'selector'>({
            body: [],
            level: getMinLevel(),
            line: context.index,
            type: context.type,
            name: parseExpression(context.line.trimStart(), context.distance, true),
          });

          pushNode(node);

          limitScope();

          scope.selectors.push(node);
        }
        break;
      case 'mixin':
        {
          const { args, value, mixinType } = parseMixin(context.line);
          const node = createSassNode<'mixin'>({
            body: [],
            level: getMinLevel(),
            line: context.index,
            type: context.type,
            name: value,
            args,
            mixinType,
          });

          pushNode(node);

          limitScope();

          scope.selectors.push(node);
        }
        break;

      case 'property':
        {
          const { value, body } = parseProperty(context.line, false);
          scope.selectors[scope.selectors.length - 1].body.push(
            createSassNode<'property'>({
              value: body,
              level: getPropLevel(),
              line: context.index,
              type: context.type,
              name: value,
            })
          );
        }
        break;

      case 'variable':
        {
          const { value, body } = parseProperty(context.line, true);
          const node = createSassNode<'variable'>({
            value: body,
            level: getMinLevel(),
            line: context.index,
            type: context.type,
            name: value,
          });
          pushNode(node);
        }
        break;

      case 'import':
        {
          const path = context.line.replace(importAtPathRegex, '$2');
          const uri = resolve(document.uri, '../', addDotSassToPath(path));
          const clampedLevel = getMinLevel();

          const node = createSassNode<'import'>({
            uri,
            level: clampedLevel,
            line: context.index,
            type: context.type,
            value: path,
          });
          pushNode(node);

          await ast.lookUpFile(uri, settings);
        }
        break;
      case 'use':
        {
          const clampedLevel = getMinLevel();
          if (canPushAtUseOrAtForwardNode) {
            // TODO ADD @use with functionality
            const path = context.line.replace(importAtPathRegex, '$2');
            const uri = resolve(document.uri, '../', addDotSassToPath(path));
            let namespace: string | null = context.line
              .replace(/(.*?as |@use)[\t ]*['"]?.*?([*\w-]*?)['"]?[\t ]*$/, '$2')
              .trim();
            namespace = namespace === '*' ? null : namespace;

            const node = createSassNode<'use'>({
              uri,
              line: context.index,
              namespace,
              type: context.type,
              value: path,
            });
            pushNode(node);

            await ast.lookUpFile(uri, settings);
          } else {
            diagnostics.push(
              createSassDiagnostic(
                '@useNotTopLevel',
                createRange(context.index, context.distance, context.line.length)
              )
            );
            pushNode(
              createSassNode<'comment'>({
                level: clampedLevel,
                line: context.index,
                type: 'comment',
                value: '// '.concat(context.line.trimLeft()),
              })
            );
          }
        }
        break;

      case 'extend':
        {
          pushNode(
            createSassNode<'extend'>({
              line: context.index,
              type: 'extend',
              level: getPropLevel(),
              name: context.line.replace(/^[\t ]*@extend/, '').trim(),
            })
          );
        }
        break;
      case 'include':
        {
          pushNode(
            createSassNode<'include'>({
              line: context.index,
              type: 'include',
              level: getPropLevel(),
              name: context.line.replace(/^[\t ]*(@include|\+)/, '').trim(),
              includeType: context.line.replace(/^[\t ]*(@include|\+)/, '$1') as any,
            })
          );
        }
        break;

      case 'emptyLine':
        {
          context.distance = scope.selectors.length * settings.tabSize;
          context.level = scope.selectors.length;
          pushNode(
            createSassNode<'emptyLine'>({ line: context.index, type: 'emptyLine' })
          );
        }
        break;

      case 'comment':
        {
          pushNode(
            createSassNode<'comment'>({
              level: getMinLevel(),
              line: context.index,
              type: 'comment',
              value: context.line.trimLeft(),
            }),
            false
          );
        }
        break;
      case 'literal':
        {
          pushNode(
            createSassNode<'literal'>({
              type: 'literal',
              line: context.index,
              value: context.line,
            })
          );
        }
        break;

      default:
        //TODO Handle default case ?
        //throw
        console.log(
          `\x1b[38;2;255;0;0;1mAST: PARSE DEFAULT CASE\x1b[m Line: ${context.line} Type: ${context.type} Index: ${context.index}`
        );
    }
  }

  return {
    body: nodes,
    diagnostics: diagnostics,
    settings: settings,
  };

  function getPropLevel(): number {
    return Math.min(Math.max(context.level, 1), scope.selectors.length);
  }
  function getMinLevel() {
    return Math.min(context.level, scope.selectors.length);
  }

  /**Removes all nodes that should not be accessible from the current scope. */
  function limitScope() {
    if (scope.selectors.length > context.level) {
      scope.selectors.splice(context.level);
      scope.variables.splice(Math.max(context.level, 1));
      scope.imports.splice(Math.max(context.level, 1));
    }
  }

  function pushNode(node: LineNode, pushDiagnostics = true) {
    // TODO EXTEND DIAGNOSTIC, invalid indentation, example, (tabSize: 2) ' .class'
    if (context.distance < settings.tabSize || scope.selectors.length === 0) {
      nodes.push(node);
    } else if (context.level > scope.selectors.length) {
      if (pushDiagnostics) {
        diagnostics.push(
          createSassDiagnostic(
            'invalidIndentation',
            createRange(context.index, context.distance, context.line.length),
            scope.selectors.length,
            settings.tabSize,
            settings.insertSpaces
          )
        );
      }
      scope.selectors[scope.selectors.length - 1].body.push(node);
    } else {
      scope.selectors[context.level - 1].body.push(node);
    }

    if (node.type === 'variable') {
      if (scope.variables[context.level]) {
        scope.variables[context.level].push(node);
      } else {
        scope.variables.push([node]);
      }
    } else if (node.type === 'import' || node.type === 'use') {
      if (scope.imports[context.level]) {
        scope.imports[context.level].push(node);
      } else {
        scope.imports.push([node]);
      }
    }
  }

  /**Parse the values of a property or variable declaration. */
  function parseProperty<R extends boolean>(
    line: string,
    stringVal: R
  ): { value: R extends true ? string : ValueNode[]; body: ValueNode[] } {
    const split = /^[\t ]*(.*?):(.*)/.exec(line)!;

    const value = split[1];
    const rawExpression = split[2];

    return {
      value: (stringVal ? value : parseExpression(value, context.distance)) as any,
      body: parseExpression(rawExpression, value.length + 1 + context.distance),
    };
  }

  function parseExpression(expression: string, startOffset: number, selectorMode = false) {
    let token = '';
    const body: ValueNode[] = [];

    const expressionNodes: SassNodes['expression'][] = [];
    let level = 0;
    let i = 0;
    let currentType: '"' | "'" | '//' | null = null;
    /**Keeps a space at the start of the token if in selectorMode*/
    let addSpace = false;

    const pushExpressionNode = (node: ValueNode) => {
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
            ref: getVarRef(val, namespace || null, startOffset + i - value.length),
          })
        );
      } else if (value) {
        pushExpressionNode(
          createSassNode<'literalValue'>({ type: 'literalValue', value })
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

  function parseMixin(
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
              body: parseExpression(expression, offset + i + 1 - (expression.length - 1)),
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
            body: parseExpression(expression, offset + i + 1 - (expression.length - 1)),
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

  function getVarRef(
    name: string,
    namespace: null | string,
    offset: number
  ): SassNodes['variableRef']['ref'] {
    const mixinVar = findVariableInMixinArgs(name);
    if (mixinVar) {
      return mixinVar;
    }

    const varNode: SassNodes['variable'] | null | undefined = scope.variables
      .flat()
      .find((v) => v.name === name);
    if (varNode) {
      return { uri: document.uri, line: varNode.line };
    }

    const importVar = findVariableInImports(name, namespace);
    if (importVar) {
      return importVar;
    }

    diagnostics.push(
      createSassDiagnostic(
        'variableNotFound',
        createRange(context.index, offset, offset + name.length),
        name
      )
    );
    return null;
  }

  function findVariableInMixinArgs(name: string): SassNodes['variableRef']['ref'] {
    const selectors = scope.selectors;

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      if (selector.type === 'mixin') {
        for (let i = 0; i < selector.args.length; i++) {
          const arg = selector.args[i];
          if (arg.value === name) {
            return { line: selector.line, uri: document.uri };
          }
        }
      }
    }
    return null;
  }

  function findVariableInImports(
    name: string,
    namespace: null | string
  ): SassNodes['variableRef']['ref'] {
    const imports = scope.imports.flat();

    for (let i = 0; i < imports.length; i++) {
      const importNode = imports[i];

      if (importNode.type === 'use' && importNode.namespace !== namespace) {
        continue;
      }
      const varNode = ast.findVariable(importNode.uri, name);
      if (varNode) {
        return { uri: importNode.uri, line: varNode.line };
      }
    }

    return null;
  }

  function getLineType(line: string): keyof SassNodes {
    const isInterpolatedProp = isInterpolatedProperty(line);
    if (context.blockCommentNode) {
      if (isBlockCommentEnd(line)) {
        context.isLastBlockCommentLine = true;
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

/**Create context, nodes etc vars based on the document type. */
function declareParseVariables(document: FullDocument | PartialDocument) {
  /**Stores information about the current line. */
  const context: ASTParserCurrentContext = {
    index: 0,
    distance: 0,
    line: '',
    type: 'emptyLine',
    level: 0,
    blockCommentNode: null,
    isLastBlockCommentLine: false,
  };

  const diagnostics: SassDiagnostic[] = [];
  if ('startLine' in document) {
    // TODO FINISH sliceNodes Function.
    const { nodes, scope } = sliceNodes(document.nodes, document.startLine);

    context.index = document.startLine;
    if (nodes[nodes.length - 1]?.type === 'blockComment') {
      context.type = 'blockComment';
    }
    const lines = new Array(document.startLine + 1).fill('').concat(document.text.split('\n'));
    return { scope, diagnostics, nodes, context, lines, isPartial: true };
  } else {
    /**Stores all nodes. */
    const nodes: LineNode[] = [];
    const scope: ParseScope = {
      selectors: [],
      variables: [],
      imports: [],
    };
    const lines = document.text.split('\n');
    return { scope, diagnostics, nodes, context, lines, isPartial: false };
  }
}
