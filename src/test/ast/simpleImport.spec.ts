import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { defaultTestFileSettings, createDocumentItem } from '../utils';

test('AST: Simple Import', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      '@import "./files/import1"\n.class\n  margin: $var',
      `${__dirname}/file.sass`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    [`${__dirname}/files/import1.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/file.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'import',
          level: 0,
          line: 0,
          uri: `${__dirname}/files/import1.sass`,
          value: './files/import1',
        },
        {
          line: 1,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 2,
              level: 1,
              value: [{ type: 'literalValue', value: 'margin' }],
              type: 'property',
              body: [
                {
                  type: 'variableRef',
                  value: '$var',
                  ref: {
                    uri: `${__dirname}/files/import1.sass`,
                    line: 0,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
