import { SassNode, SassASTOptions, SassNodes, NodeValue } from './nodes';
import { SassFile } from './utils';

interface StringifyState {
  currentLine: number;
  wasLastLineEmpty: boolean;
}

export class ASTStringify {
  STATE: StringifyState = {
    currentLine: 0,
    wasLastLineEmpty: false,
  };

  stringify(file: SassFile, options: SassASTOptions) {
    const text = this.stringifyNodes(file.body, options);
    // TODO maybe vscode handles this? update diagnostic positions??.
    file.diagnostics = file.diagnostics.filter((v) => !v.isResolvedByStringify);

    return text;
  }

  private stringifyNodes(nodes: SassNode[], options: SassASTOptions) {
    let text = '';
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 'emptyLine' && this.STATE.wasLastLineEmpty) {
        nodes.splice(i, 1);
        i--; // without decreasing the index the loop will skip the next node, because the array is one element shorter.
      }
      text += this.stringifyNode(node, options);
    }
    return text;
  }

  private stringifyNode(node: SassNode, options: SassASTOptions) {
    let text = '';
    switch (node.type) {
      case 'comment':
        this.increaseStateLineNumber(node);
        text += this.addLine(node.value, node.level, options);
        break;
      case 'blockComment':
        this.increaseStateLineNumber(node);
        this.STATE.currentLine--; // decrease because the block comment node stores the first line twice, in the node and in the first element of the body.
        node.body.forEach((contentNode) => {
          this.increaseStateLineNumber(contentNode);
          text += this.addLine(contentNode.value, node.level, options);
        });
        break;
      case 'extend':
        this.increaseStateLineNumber(node);
        text += this.addLine(`@extend ${node.value}`, node.level, options);
        break;
      case 'include':
        this.increaseStateLineNumber(node);
        text += this.addLine(
          `${node.includeType === '+' ? '+' : '@include '}${node.value}`,
          node.level,
          options
        );
        break;
      case 'import':
        this.increaseStateLineNumber(node);
        text += this.addLine(`@import '${node.value}'`, node.level, options);
        break;
      case 'use':
        // TODO ADD @use "with" functionality
        this.increaseStateLineNumber(node);
        text += this.addLine(this.stringifyAtUse(node), 0, options);
        break;
      case 'selector':
        this.increaseStateLineNumber(node);
        text += this.addLine(stringifySelector(node.value), node.level, options);
        text += this.stringifyNodes(node.body, options);
        break;
      case 'mixin':
        this.increaseStateLineNumber(node);
        text += this.addLine(
          `${node.mixinType === '=' ? '=' : '@mixin '}${node.value}${
            node.args.length === 0
              ? ''
              : node.args.reduce((acc, item, index) => {
                  acc += `${item.value}${item.body ? ':'.concat(stringifyValues(item.body)) : ''}`;
                  if (node.args.length - 1 !== index) {
                    acc += ', ';
                  } else {
                    acc += ')';
                  }
                  return acc;
                }, '(')
          }`,
          node.level,
          options
        );
        text += this.stringifyNodes(node.body, options);
        break;
      case 'variable':
        this.increaseStateLineNumber(node);
        text += this.addLine(`${node.value}:${stringifyValues(node.body)}`, node.level, options);
        break;
      case 'property':
        this.increaseStateLineNumber(node);
        text += this.addLine(
          `${stringifyValues(node.value, true)}:${stringifyValues(node.body)}`,
          node.level,
          options
        );
        break;
      case 'emptyLine':
        if (!this.STATE.wasLastLineEmpty) {
          this.increaseStateLineNumber(node);
          text += '\n';
          this.STATE.wasLastLineEmpty = true;
        }
        break;

      case 'literal':
        if (node.line !== undefined) {
          this.increaseStateLineNumber(node as any);
          text += this.addLine(node.value, 0, options);
        }
        break;
      case 'expression':
      case 'variableRef':
        text += stringifyValue(node);
        break;
    }

    return text;
  }
  private increaseStateLineNumber(node: { line: number }) {
    node.line = this.STATE.currentLine;
    this.STATE.currentLine++;
    this.STATE.wasLastLineEmpty = false;
  }

  private addLine(text: string, level: number, options: SassASTOptions) {
    return `${
      options.insertSpaces ? ' '.repeat(level * options.tabSize) : '\t'.repeat(level)
    }${text}\n`;
  }

  private stringifyAtUse(node: SassNodes['use']) {
    const useNamespace = node.namespace && !node.value.endsWith(node.namespace);
    return `@use '${node.value}'${useNamespace ? ` as ${node.namespace}` : ''}`;
  }
}

function stringifySelector(nodes: NodeValue[]) {
  let text = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'expression') {
      text += stringifyExpression(node).replace(/^ /, '');
    } else {
      text += node.value;
    }
  }
  return text;
}

export function stringifyValues(nodes: NodeValue[], removeFirstSpace = false) {
  let text = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    text += stringifyValue(node);
  }
  return removeFirstSpace ? text.replace(/^ /, '') : text;
}

function stringifyValue(node: NodeValue) {
  if (node.type === 'expression') {
    return stringifyExpression(node);
  } else {
    return ` ${node.value}`;
  }
}

function stringifyExpression(node: SassNodes['expression']) {
  switch (node.expressionType) {
    case 'func':
      return ` ${node.funcName}(${stringifyValues(node.body).replace(/^ /, '')})`;
    case 'interpolated':
      return ` #{${stringifyValues(node.body).replace(/^ /, '')}}`;
  }
}
