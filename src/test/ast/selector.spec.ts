import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';

test('Complex Selector', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `#{$body}.class::hover,  
.class#id::not(.a)    a[type="button"]   , // asd
.class .class#id    `,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [createSassDiagnostic('variableNotFound', createRange(0, 2, 7), '$body')],
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
            { type: 'literal', value: '.class::hover,' },
          ],
          body: [],
        },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: [
            {
              type: 'expression',
              expressionType: 'func',
              funcName: '.class#id::not',
              body: [{ type: 'literal', value: '.a' }],
            },
            { type: 'literal', value: ' a[type="button"]' },
            { type: 'literal', value: ' ,' },
            { type: 'literal', value: ' // asd' },
          ],
          body: [],
        },
        {
          type: 'selector',
          level: 0,
          line: 2,
          value: [
            { type: 'literal', value: '.class' },
            { type: 'literal', value: ' .class#id' },
          ],
          body: [],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toBe(
    `#{$body}.class::hover,
.class#id::not(.a) a[type="button"] , // asd
.class .class#id`
  );
});
