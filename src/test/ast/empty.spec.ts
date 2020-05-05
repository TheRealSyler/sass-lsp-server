import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: EmptyLine and empty property', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
.class

  margin-top:


`,
      `/file`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      settings: defaultTestFileSettings,
      diagnostics: [],
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            { type: 'emptyLine', line: 2 },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literalValue', value: 'margin-top' }],
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

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toEqual(`
.class

  margin-top:
`);
  const expectedFilesAfterFormat: AbstractSyntaxTree['files'] = {
    '/file': {
      settings: defaultTestFileSettings,
      diagnostics: [],
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            { type: 'emptyLine', line: 2 },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literalValue', value: 'margin-top' }],
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
