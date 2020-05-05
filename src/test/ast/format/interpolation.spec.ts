import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('Sass Format: Selector Interpolation', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `#{$body}
    color: red

#{$main}
  color:red
  #{$var}: 1rem`,
      '/file'
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      settings: defaultTestFileSettings,
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(0, 2, 7), '$body'),
        createSassDiagnostic('variableNotFound', createRange(3, 2, 7), '$main'),
        createSassDiagnostic('variableNotFound', createRange(5, 4, 8), '$var'),
      ],
      body: [
        {
          type: 'selector',
          level: 0,
          line: 0,
          value: [
            {
              type: 'expression',
              expressionType: 'interpolated',
              body: [{ type: 'variableRef', ref: null, value: '$body' }],
            },
          ],
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              value: [{ type: 'literalValue', value: 'color' }],
              body: [{ type: 'literalValue', value: 'red' }],
            },
            { type: 'emptyLine', line: 2 },
          ],
        },
        {
          type: 'selector',
          level: 0,
          line: 3,
          value: [
            {
              type: 'expression',
              expressionType: 'interpolated',
              body: [{ type: 'variableRef', ref: null, value: '$main' }],
            },
          ],
          body: [
            {
              type: 'property',
              level: 1,
              line: 4,
              value: [{ type: 'literalValue', value: 'color' }],
              body: [{ type: 'literalValue', value: 'red' }],
            },
            {
              type: 'property',
              level: 1,
              line: 5,
              value: [
                {
                  type: 'expression',
                  expressionType: 'interpolated',
                  body: [{ type: 'variableRef', ref: null, value: '$var' }],
                },
              ],
              body: [{ type: 'literalValue', value: '1rem' }],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toBe(`#{$body}
  color: red

#{$main}
  color: red
  #{$var}: 1rem`);
});
