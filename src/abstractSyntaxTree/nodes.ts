export interface BaseNode {
  body: LineNode[] | ValueNode[] | null;
  line: number;
  level: number;
  type: keyof SassNodes;
  value: string | ValueNode[];
}

export interface SelectorNode extends BaseNode {
  body: LineNode[];
  value: ValueNode[];
  type: 'selector';
}

export interface ImportNode extends Omit<BaseNode, 'body'> {
  value: string;
  uri: string;
  type: 'import';
}
export interface UseNode extends Omit<BaseNode, 'body' | 'level'> {
  value: string;
  uri: string;
  namespace: string | null;
  type: 'use';
}
export interface CommentNode extends Omit<BaseNode, 'body'> {
  value: string;
  type: 'comment';
}

export interface BlockCommentContentNode {
  value: string;
  type: 'blockCommentContent';
  line: number;
}

export interface BlockCommentNode extends Omit<BaseNode, 'body' | 'value'> {
  body: BlockCommentContentNode[];
  type: 'blockComment';
}

export interface LiteralNode {
  type: 'literal';
  line: number;
  value: string;
}
export interface LiteralValueNode {
  type: 'literalValue';
  value: string;
}
export interface VariableRefNode {
  type: 'variableRef';
  ref: {
    uri: string;
    line: number;
  } | null;
  value: string;
}
interface ExpressionNodeBase {
  body: ValueNode[];
  type: 'expression';
  expressionType: keyof SassExpressionNodes;
}
export interface FuncExpressionNode extends ExpressionNodeBase {
  expressionType: 'func';
  funcName: string;
}
export interface InterpolationExpressionNode extends ExpressionNodeBase {
  expressionType: 'interpolated';
}
interface SassExpressionNodes {
  func: FuncExpressionNode;
  interpolated: InterpolationExpressionNode;
}

export type ExpressionNode = SassExpressionNodes[keyof SassExpressionNodes];

export interface PropertyNode extends BaseNode {
  body: ValueNode[];
  value: ValueNode[];
  type: 'property';
}
export interface VariableNode extends BaseNode {
  body: ValueNode[];
  value: string;
  type: 'variable';
}
export interface EmptyLineNode extends Pick<BaseNode, 'type' | 'line'> {
  type: 'emptyLine';
}
export interface ExtendNode extends Pick<BaseNode, 'type' | 'line' | 'value' | 'level'> {
  type: 'extend';
}
export interface IncludeNode extends Pick<BaseNode, 'type' | 'line' | 'value' | 'level'> {
  type: 'include';
  includeType: '@include' | '+';
}

export interface FontFaceNode extends Omit<BaseNode, 'value'> {
  type: 'fontFace';
  body: LineNode[];
}

export interface MixinNode extends BaseNode {
  body: LineNode[];
  type: 'mixin';
  mixinType: '@mixin' | '=';
  args: { value: string; body: ValueNode[] | null }[];
}

type _SassNode<T extends keyof SassNodes> = SassNodes[T];

export type SassNode = _SassNode<keyof SassNodes>;

type _SassLineNode<T extends keyof LineNodes> = LineNodes[T];

/**Nodes that are not excursively a value for other nodes.*/
export type LineNode = _SassLineNode<keyof LineNodes>;

type _SassValueNode<T extends keyof ValueNodes> = ValueNodes[T];
/**Nodes that represent a value for another node. */
export type ValueNode = _SassValueNode<keyof ValueNodes>;

interface LineNodes {
  import: ImportNode;
  use: UseNode;
  selector: SelectorNode;
  property: PropertyNode;
  variable: VariableNode;
  comment: CommentNode;
  emptyLine: EmptyLineNode;
  mixin: MixinNode;
  extend: ExtendNode;
  blockComment: BlockCommentNode;
  include: IncludeNode;
  fontFace: FontFaceNode;
  literal: LiteralNode;
}

interface ValueNodes {
  literalValue: LiteralValueNode;
  expression: ExpressionNode;
  variableRef: VariableRefNode;
}

export interface SassNodes extends LineNodes, ValueNodes {
  blockCommentContent: BlockCommentContentNode;
}
