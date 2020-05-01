import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';

test('AST: Property functions', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `
.class
  border: solid calc(1rem - 20px) darken(#fff, 0.4)
  margin: #{$var} #{$var2}
`,
    `/file`,
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(3, 12, 16), '$var'),
        createSassDiagnostic('variableNotFound', createRange(3, 20, 25), '$var2'),
      ],
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 2,
              value: [{ type: 'literal', value: 'border' }],
              body: [
                { type: 'literal', value: 'solid' },
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'calc',
                  body: [
                    { type: 'literal', value: '1rem' },
                    { type: 'literal', value: '-' },
                    { type: 'literal', value: '20px' },
                  ],
                },
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'darken',
                  body: [
                    { type: 'literal', value: '#fff,' },
                    { type: 'literal', value: '0.4' },
                  ],
                },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literal', value: 'margin' }],
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
