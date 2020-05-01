import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('AST: Simple Class', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile('.class\n  margin: 20px\n  &:hover\n    color: red', '/file', {
    insertSpaces: false,
    tabSize: 2,
  });

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [{ type: 'literal', value: '20px' }],
            },
            {
              line: 2,
              level: 1,
              body: [
                {
                  level: 2,
                  line: 3,
                  type: 'property',
                  value: [{ type: 'literal', value: 'color' }],
                  body: [{ type: 'literal', value: 'red' }],
                },
              ],
              value: [{ type: 'literal', value: '&:hover' }],
              type: 'selector',
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
