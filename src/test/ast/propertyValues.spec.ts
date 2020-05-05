import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Property Values', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem('.class\n  margin: 2rem auto', '/file'),
    defaultTestFileSettings
  );
  await ast.parse(
    createDocumentItem('$var: 20px\n.class\n  margin: $var', '/file/variable'),
    defaultTestFileSettings
  );
  await ast.parse(
    createDocumentItem('.class\n  margin: calc(calc(20px - $var2) + $var)', '/file/function'),
    defaultTestFileSettings
  );
  await ast.parse(
    createDocumentItem('.class\n  margin: #{calc(100vh - #{$var})}', '/file/interpolation'),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literalValue', value: 'margin' }],
              type: 'property',
              body: [
                { type: 'literalValue', value: '2rem' },
                { type: 'literalValue', value: 'auto' },
              ],
            },
          ],
        },
      ],
    },
    '/file/variable': {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          body: [{ type: 'literalValue', value: '20px' }],
          level: 0,
          line: 0,
          value: '$var',
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
      settings: defaultTestFileSettings,
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literalValue', value: 'margin' }],
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
                        { type: 'literalValue', value: '20px' },
                        { type: 'literalValue', value: '-' },
                        { type: 'variableRef', value: '$var2', ref: null },
                      ],
                    },
                    { type: 'literalValue', value: '+' },
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
      settings: defaultTestFileSettings,
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literalValue', value: 'margin' }],
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
                        { type: 'literalValue', value: '100vh' },
                        { type: 'literalValue', value: '-' },
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
