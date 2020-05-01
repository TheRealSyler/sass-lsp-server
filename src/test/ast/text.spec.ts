import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('AST: text', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `.class
  margin`,
    `/file`,
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          type: 'selector',
          level: 0,
          line: 0,
          value: [{ type: 'literal', value: '.class' }],
          body: [{ type: 'literal', value: '  margin', line: 1 }],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toEqual(`.class
  margin`);
});
