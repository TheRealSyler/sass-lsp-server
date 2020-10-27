export interface BaseNode {
  line: number;
  level: number;
  type: keyof SassNodes;
}

interface PropBaseNode extends BaseNode {
  name: string | ValueNode[];
}

interface BaseSelectorNode extends PropBaseNode {
  /**This property contains the child nodes of this node. */
  body: LineNode[];
}

export interface SelectorNode extends BaseSelectorNode {
  name: ValueNode[];
  type: 'selector';
}

export interface FontFaceNode extends Omit<BaseSelectorNode, 'name'> {
  type: 'fontFace';
}

export interface MixinNode extends BaseSelectorNode {
  type: 'mixin';
  mixinType: '@mixin' | '=';
  args: { value: string; body: ValueNode[] | null }[];
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

export interface PropertyNode extends PropBaseNode {
  value: ValueNode[];
  name: ValueNode[];
  type: 'property';
}
export interface VariableNode extends PropBaseNode {
  value: ValueNode[];
  name: string;
  type: 'variable';
}

export interface ExtendNode extends Pick<PropBaseNode, 'type' | 'line' | 'name' | 'level'> {
  type: 'extend';
}
export interface IncludeNode extends Pick<PropBaseNode, 'type' | 'line' | 'name' | 'level'> {
  type: 'include';
  includeType: '@include' | '+';
}
export interface EmptyLineNode extends Pick<BaseNode, 'type' | 'line'> {
  type: 'emptyLine';
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
