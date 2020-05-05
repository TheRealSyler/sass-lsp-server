import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: text', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `.class
  margin`,
      `/file`
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
          level: 0,
          line: 0,
          value: [{ type: 'literalValue', value: '.class' }],
          body: [{ type: 'literal', value: '  margin', line: 1 }],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toEqual(`.class
  margin`);
});
