import { SassNode, SassNodes, ValueNode } from './nodes';
import { SassFile } from './abstractSyntaxTree';
import { FileSettings } from '../defaultSettingsAndInterfaces';

interface StringifyState {
  currentLine: number;
  wasLastLineEmpty: boolean;
}

export function AstStringify(file: SassFile, _settings?: Partial<FileSettings>) {
  const STATE: StringifyState = {
    currentLine: 0,
    wasLastLineEmpty: false,
  };

  const settings = { ...file.settings, ...(_settings || {}) };

  const text = stringifyNodes(file.body);
  // TODO maybe vscode handles this? update diagnostic positions??.
  file.diagnostics = file.diagnostics.filter((v) => !v.isResolvedByStringify);

  return text;

  function stringifyNodes(nodes: SassNode[]) {
    let text = '';
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 'emptyLine' && STATE.wasLastLineEmpty) {
        nodes.splice(i, 1);
        i--; // without decreasing the index the loop will skip the next node, because the array is one element shorter.
      }
      text += stringifyNode(node);
    }
    return text;
  }

  function stringifyNode(node: SassNode) {
    let text = '';
    switch (node.type) {
      case 'comment':
        increaseStateLineNumber(node);
        text += addLine(node.value, node.level);
        break;
      case 'blockComment':
        increaseStateLineNumber(node);
        STATE.currentLine--; // decrease because the block comment node stores the first line twice, in the node and in the first element of the body.
        node.body.forEach((contentNode) => {
          increaseStateLineNumber(contentNode);
          text += addLine(contentNode.value, node.level);
        });
        break;
      case 'extend':
        increaseStateLineNumber(node);
        text += addLine(`@extend ${node.value}`, node.level);
        break;
      case 'include':
        increaseStateLineNumber(node);
        text += addLine(`${node.includeType === '+' ? '+' : '@include '}${node.value}`, node.level);
        break;
      case 'import':
        increaseStateLineNumber(node);
        text += addLine(`@import '${node.value}'`, node.level);
        break;
      case 'use':
        // TODO ADD @use "with" functionality
        increaseStateLineNumber(node);
        text += addLine(stringifyAtUse(node), 0);
        break;
      case 'selector':
        increaseStateLineNumber(node);
        text += addLine(stringifySelector(node.value), node.level);
        text += stringifyNodes(node.body);
        break;
      case 'mixin':
        increaseStateLineNumber(node);
        text += addLine(
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
          node.level
        );
        text += stringifyNodes(node.body);
        break;
      case 'variable':
        increaseStateLineNumber(node);
        text += addLine(`${node.value}:${stringifyValues(node.body)}`, node.level);
        break;
      case 'property':
        increaseStateLineNumber(node);
        text += addLine(
          `${stringifyValues(node.value, true)}:${stringifyValues(node.body)}`,
          node.level
        );
        break;
      case 'emptyLine':
        if (!STATE.wasLastLineEmpty) {
          increaseStateLineNumber(node);
          text += '\n';
          STATE.wasLastLineEmpty = true;
        }
        break;

      case 'literal':
        if (node.line !== undefined) {
          increaseStateLineNumber(node as any);
          text += addLine(node.value, 0);
        }
        break;
      case 'expression':
      case 'variableRef':
        text += stringifyValue(node);
        break;
    }

    return text;
  }
  function increaseStateLineNumber(node: { line: number }) {
    node.line = STATE.currentLine;
    STATE.currentLine++;
    STATE.wasLastLineEmpty = false;
  }

  function addLine(text: string, level: number) {
    return `${
      settings.insertSpaces ? ' '.repeat(level * settings.tabSize) : '\t'.repeat(level)
    }${text}\n`;
  }

  function stringifyAtUse(node: SassNodes['use']) {
    const useNamespace = node.namespace && !node.value.endsWith(node.namespace);
    return `@use '${node.value}'${useNamespace ? ` as ${node.namespace}` : ''}`;
  }
}

function stringifySelector(nodes: ValueNode[]) {
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

export function stringifyValues(nodes: ValueNode[], removeFirstSpace = false) {
  let text = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    text += stringifyValue(node);
  }
  return removeFirstSpace ? text.replace(/^ /, '') : text;
}

function stringifyValue(node: ValueNode) {
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
