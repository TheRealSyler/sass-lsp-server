import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('AST: Simple Stringify', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `.class
  margin: 20px
  padding: calc(20px + 50%)`,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          type: 'selector',
          line: 0,
          level: 0,
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              value: [{ type: 'literal', value: 'margin' }],
              body: [{ type: 'literal', value: '20px' }],
            },
            {
              type: 'property',
              level: 1,
              line: 2,
              value: [{ type: 'literal', value: 'padding' }],
              body: [
                {
                  type: 'expression',
                  body: [
                    { type: 'literal', value: '20px' },
                    { type: 'literal', value: '+' },
                    { type: 'literal', value: '50%' },
                  ],
                  expressionType: 'func',
                  funcName: 'calc',
                },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toStrictEqual(`.class
  margin: 20px
  padding: calc(20px + 50%)`);
  expect(await ast.stringifyFile('/file', { insertSpaces: false, tabSize: 2 }))
    .toStrictEqual(`.class
	margin: 20px
	padding: calc(20px + 50%)`);
  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 8 })).toStrictEqual(`.class
        margin: 20px
        padding: calc(20px + 50%)`);
});
