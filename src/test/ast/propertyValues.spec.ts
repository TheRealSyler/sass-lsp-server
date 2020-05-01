import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';

test('AST: Property Values', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile('.class\n  margin: 2rem auto', '/file', {
    insertSpaces: false,
    tabSize: 2,
  });
  await ast.parseFile('$var: 20px\n.class\n  margin: $var', '/file/variable', {
    insertSpaces: false,
    tabSize: 2,
  });
  await ast.parseFile('.class\n  margin: calc(calc(20px - $var2) + $var)', '/file/function', {
    insertSpaces: false,
    tabSize: 2,
  });
  await ast.parseFile('.class\n  margin: #{calc(100vh - #{$var})}', '/file/interpolation', {
    insertSpaces: false,
    tabSize: 2,
  });

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [
                { type: 'literal', value: '2rem' },
                { type: 'literal', value: 'auto' },
              ],
            },
          ],
        },
      ],
    },
    '/file/variable': {
      diagnostics: [],
      body: [
        {
          type: 'variable',
          body: [{ type: 'literal', value: '20px' }],
          level: 0,
          line: 0,
          value: '$var',
        },
        {
          line: 1,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 2,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [
                {
                  type: 'variableRef',
                  value: '$var',
                  ref: {
                    uri: '/file/variable',

                    line: 0,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    '/file/function': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(1, 27, 32), '$var2'),
        createSassDiagnostic('variableNotFound', createRange(1, 36, 40), '$var'),
      ],
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'calc',
                  body: [
                    {
                      type: 'expression',
                      expressionType: 'func',
                      funcName: 'calc',
                      body: [
                        { type: 'literal', value: '20px' },
                        { type: 'literal', value: '-' },
                        { type: 'variableRef', value: '$var2', ref: null },
                      ],
                    },
                    { type: 'literal', value: '+' },
                    { type: 'variableRef', value: '$var', ref: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    '/file/interpolation': {
      diagnostics: [createSassDiagnostic('variableNotFound', createRange(1, 27, 31), '$var')],
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [
                {
                  type: 'expression',
                  expressionType: 'interpolated',
                  body: [
                    {
                      expressionType: 'func',
                      type: 'expression',
                      body: [
                        { type: 'literal', value: '100vh' },
                        { type: 'literal', value: '-' },
                        {
                          type: 'expression',
                          expressionType: 'interpolated',
                          body: [
                            {
                              type: 'variableRef',
                              ref: null,
                              value: '$var',
                            },
                          ],
                        },
                      ],
                      funcName: 'calc',
                    },
                  ],
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
