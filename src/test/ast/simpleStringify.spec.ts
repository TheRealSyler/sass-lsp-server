import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { defaultTestFileSettings, createDocumentItem } from '../utils';

test('AST: Simple Stringify', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `.class
  margin: 20px
  padding: calc(20px + 50%)`,
      '/file'
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'selector',
          line: 0,
          level: 0,
          name: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              name: [{ type: 'literalValue', value: 'margin' }],
              value: [{ type: 'literalValue', value: '20px' }],
            },
            {
              type: 'property',
              level: 1,
              line: 2,
              name: [{ type: 'literalValue', value: 'padding' }],
              value: [
                {
                  type: 'expression',
                  body: [
                    { type: 'literalValue', value: '20px' },
                    { type: 'literalValue', value: '+' },
                    { type: 'literalValue', value: '50%' },
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
