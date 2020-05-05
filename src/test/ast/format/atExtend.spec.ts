import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('AST: (Format) AtExtend', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `

    .class
      @extend %profile
        margin: 20px
`,
      '/file'
    ),
    defaultTestFileSettings
  );
  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toEqual(
    `
.class
  @extend %profile
  margin: 20px
`
  );
});
