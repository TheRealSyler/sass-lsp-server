import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('Sass Format: Indentation & Whitespace', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
@import ../files/import1.sass

$test: 23


      @mixin name ( $test, $test2: 'as,"$123"', $test: $sd )
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
    display: none
    content: ""
                  left: 5px
      div
 top: $awd
                  @include name ($test)

`,
      `${__dirname}/file.sass`
    ),
    defaultTestFileSettings
  );
  expect(await ast.stringifyFile(`${__dirname}/file.sass`, defaultTestFileSettings)).toEqual(
    `
@import '../files/import1.sass'

$test: 23

@mixin name($test, $test2: 'as,"$123"', $test: $sd)
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
  width: $test
  height: 16px
  cursor: pointer
  position: relative
  i:not(.fv)
    &::after
  display: block
      background: $light-gray
      &::after
        position: absolute
    display: none
    content: ""
        left: 5px
      div
  top: $awd
        @include name ($test)
`
  );
});

test('Sass Format: Simple Indentation', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
  
.class
    margin: 10px
              padding: 10rem
`,
      '/file'
    ),
    defaultTestFileSettings
  );
  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toEqual(
    `
.class
  margin: 10px
  padding: 10rem
`
  );
});
