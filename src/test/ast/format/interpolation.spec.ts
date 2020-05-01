import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../../abstractSyntaxTree/diagnostics';

test('Sass Format: Selector Interpolation', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `#{$body}
    color: red

#{$main}
  color:red
  #{$var}: 1rem`,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
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
              value: [{ type: 'literal', value: 'color' }],
              body: [{ type: 'literal', value: 'red' }],
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
              value: [{ type: 'literal', value: 'color' }],
              body: [{ type: 'literal', value: 'red' }],
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
              body: [{ type: 'literal', value: '1rem' }],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toBe(`#{$body}
  color: red

#{$main}
  color: red
  #{$var}: 1rem`);
});
