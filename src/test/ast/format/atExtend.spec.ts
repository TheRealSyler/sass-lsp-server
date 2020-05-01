import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';

test('Sass Format Case 11', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `

    .class
      @extend %profile
        margin: 20px
`,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );
  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toEqual(
    `
.class
  @extend %profile
  margin: 20px
`
  );
});
