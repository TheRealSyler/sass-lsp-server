import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Import Scopes', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `@import "./files/import1"
@import "./files/import2"
.class
  @import "./files/import3.sass"
  &:hover
    @import "./files/import4"
.class2
  @import "./files/import5"
  margin: $var $var2 $var3 $var4
  padding: $var5`,
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
    [`${__dirname}/files/import2.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var2',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/files/import3.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var3',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/files/import4.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var4',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/files/import5.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var5',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/file.sass`]: {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(8, 21, 26), '$var3'),
        createSassDiagnostic('variableNotFound', createRange(8, 27, 32), '$var4'),
      ],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'import',
          level: 0,
          line: 0,
          value: './files/import1',
          uri: `${__dirname}/files/import1.sass`,
        },
        {
          type: 'import',
          level: 0,
          line: 1,
          value: './files/import2',
          uri: `${__dirname}/files/import2.sass`,
        },
        {
          line: 2,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              type: 'import',
              level: 1,
              line: 3,
              value: './files/import3.sass',
              uri: `${__dirname}/files/import3.sass`,
            },
            {
              line: 4,
              level: 1,
              value: [{ type: 'literalValue', value: '&:hover' }],
              type: 'selector',
              body: [
                {
                  type: 'import',
                  level: 2,
                  line: 5,
                  value: './files/import4',
                  uri: `${__dirname}/files/import4.sass`,
                },
              ],
            },
          ],
        },
        {
          type: 'selector',
          level: 0,
          line: 6,
          value: [{ type: 'literalValue', value: '.class2' }],
          body: [
            {
              type: 'import',
              level: 1,
              line: 7,
              value: './files/import5',
              uri: `${__dirname}/files/import5.sass`,
            },
            {
              type: 'property',
              level: 1,
              line: 8,
              value: [{ type: 'literalValue', value: 'margin' }],
              body: [
                {
                  type: 'variableRef',
                  ref: { line: 0, uri: `${__dirname}/files/import1.sass` },
                  value: '$var',
                },
                {
                  type: 'variableRef',
                  ref: { line: 0, uri: `${__dirname}/files/import2.sass` },
                  value: '$var2',
                },
                { type: 'variableRef', ref: null, value: '$var3' },
                { type: 'variableRef', ref: null, value: '$var4' },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 9,
              value: [{ type: 'literalValue', value: 'padding' }],
              body: [
                {
                  type: 'variableRef',
                  ref: { line: 0, uri: `${__dirname}/files/import5.sass` },
                  value: '$var5',
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
