import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Property functions', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
.class
  border: solid calc(1rem - 20px) darken(#fff, 0.4)
  margin: #{$var} #{$var2}
`,
      `/file`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(3, 12, 16), '$var'),
        createSassDiagnostic('variableNotFound', createRange(3, 20, 25), '$var2'),
      ],
      settings: defaultTestFileSettings,
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 2,
              value: [{ type: 'literalValue', value: 'border' }],
              body: [
                { type: 'literalValue', value: 'solid' },
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'calc',
                  body: [
                    { type: 'literalValue', value: '1rem' },
                    { type: 'literalValue', value: '-' },
                    { type: 'literalValue', value: '20px' },
                  ],
                },
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'darken',
                  body: [
                    { type: 'literalValue', value: '#fff,' },
                    { type: 'literalValue', value: '0.4' },
                  ],
                },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literalValue', value: 'margin' }],
              body: [
                {
                  type: 'expression',
                  expressionType: 'interpolated',
                  body: [{ type: 'variableRef', ref: null, value: '$var' }],
                },
                {
                  type: 'expression',
                  expressionType: 'interpolated',
                  body: [{ type: 'variableRef', ref: null, value: '$var2' }],
                },
              ],
            },
            { type: 'emptyLine', line: 4 },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
