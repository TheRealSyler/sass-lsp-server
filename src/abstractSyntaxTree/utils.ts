import { SassNodes, LineNode, SassNode, BaseNode } from './nodes';
import { ParseScope } from './parse';

export function isUse(text: string) {
  return /^[\t ]*@use/.test(text);
}
export function isImport(text: string) {
  return /^[\t ]*@import/.test(text);
}

export function createSassNode<K extends keyof SassNodes>(values: SassNodes[K]) {
  return values;
}

export function findNode(nodes: LineNode[], line: number) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nextNode = nodes[i + 1];
    if (line === node.line) {
      return node;
    } else if (line === nextNode?.line) {
      return nextNode;
    } else if (line < nextNode?.line || i === nodes.length - 1) {
      return findNodeInBody(node, line);
    }
  }
  return null;
}
function findNodeInBody(_node: SassNode, line: number): SassNode | null {
  if ('body' in _node) {
    for (let i = 0; i < _node.body.length; i++) {
      const node = _node.body[i];
      const nextNode = _node.body[i + 1];
      if ('line' in node) {
        if (line === node.line) {
          return node;
        } else if (i === _node.body.length - 1) {
          return findNodeInBody(node, line);
        } else if ('line' in nextNode) {
          if (line === nextNode?.line) {
            return nextNode;
          } else if (line < nextNode?.line) {
            return findNodeInBody(node, line);
          }
        }
      }
    }
  }
  return null;
}
// TODO Finish slice nodes function.
export function sliceNodes(
  _nodes: LineNode[],
  line: number
): { scope: ParseScope; nodes: LineNode[] } {
  const nodes: LineNode[] = [];
  // TODO fill scope.
  const scope: ParseScope = {
    selectors: [],
    variables: [],
    imports: [],
  };

  for (let i = 0; i < _nodes.length; i++) {
    const node = _nodes[i];
    const nextNode = _nodes[i + 1];

    if (nextNode?.line < line) {
      sliceBodyNode(node, line);
      nodes.push(node);
      break;
    }
    if (_nodes.length - 1 === i && 'body' in node) {
      sliceBodyNode(node, line);
    }
    nodes.push(node);
  }

  return {
    nodes,
    scope,
  };
}
function sliceBodyNode(node: SassNode, line: number) {
  if ('body' in node) {
    const body = [];
    for (let j = 0; j < node.body.length; j++) {
      const childNode = node.body[j];
      if ('line' in childNode) {
        if (childNode.line > line) {
          break;
        } else if ('body' in childNode) {
          sliceBodyNode(childNode, line);
        }
        body.push(childNode as any);
      }
    }
    node.body = body;
  }
}

// export function execGlobalRegex(regex: RegExp, text: string, func: (m: RegExpExecArray) => void) {
//   let m;
//   while ((m = regex.exec(text)) !== null) {
//     if (m.index === regex.lastIndex) {
//       regex.lastIndex++;
//     }
//     func(m);
//   }
