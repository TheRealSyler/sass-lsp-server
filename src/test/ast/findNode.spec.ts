import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';
import { SassNode } from '../../abstractSyntaxTree/nodes';

test('AST: FindNode', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
@import "./files/import1"
@import "./files/import2"
.class
  @import "./files/import3.sass"
  &:hover
    @import "./files/import4"
.class2
  @import "./files/import5"
  margin: $var $var2 $var3 $var4
  padding: $var5

@import ../files/import1.sass

$test: 23
  
  
@mixin name ( $test, $test2: 'as,"$123"', $test: $sd )
        .class
          .subClass
            .subSubClass
                &:active
           left: $test
  

     
  
   
   
  
.checkbox
    background-color: $dark-gray
    border: solid 1px $font
    border-radius: 2px
    outline: none
    appearance: none
    -webkit-appearance: none
    -moz-appearance: none
    width:   $test
    height: 16px
    cursor: pointer
    position: relative
  i:not(.fv)
    &::after
        display: block
        background: $light-gray
    &::after
        position: absolute


`,
      `/file`
    ),
    defaultTestFileSettings
  );

  let foundNode: SassNode = {
    type: 'property',
    body: [{ type: 'variableRef', value: '$var5', ref: null }],
    level: 1,
    line: 10,
    value: [{ type: 'literalValue', value: 'padding' }],
  };

  expect(ast.findNode('/file', 10)).toStrictEqual(foundNode);
  foundNode = {
    type: 'property',
    body: [{ type: 'variableRef', value: '$test', ref: { line: 17, uri: '/file' } }],
    level: 5,
    line: 22,
    value: [{ type: 'literalValue', value: 'left' }],
  };

  expect(ast.findNode('/file', 22)).toStrictEqual(foundNode);
  foundNode = {
    type: 'property',
    body: [{ type: 'literalValue', value: 'block' }],
    level: 3,
    line: 44,
    value: [{ type: 'literalValue', value: 'display' }],
  };

  expect(ast.findNode('/file', 44)).toStrictEqual(foundNode);

  foundNode = {
    type: 'property',
    body: [{ type: 'literalValue', value: 'absolute' }],
    level: 3,
    line: 47,
    value: [{ type: 'literalValue', value: 'position' }],
  };

  expect(ast.findNode('/file', 47)).toStrictEqual(foundNode);
});
