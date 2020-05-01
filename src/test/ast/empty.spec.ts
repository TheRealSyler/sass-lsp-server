import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('AST: EmptyLine and empty property', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `
.class

  margin-top:


`,
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
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literal', value: '.class' }],
          body: [
            { type: 'emptyLine', line: 2 },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literal', value: 'margin-top' }],
              body: [],
            },
            { type: 'emptyLine', line: 4 },
            { type: 'emptyLine', line: 5 },
            { type: 'emptyLine', line: 6 },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toEqual(`
.class

  margin-top:
`);
  const expectedFilesAfterFormat: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literal', value: '.class' }],
          body: [
            { type: 'emptyLine', line: 2 },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literal', value: 'margin-top' }],
              body: [],
            },
            { type: 'emptyLine', line: 4 },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFilesAfterFormat);
});
