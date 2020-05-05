import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('Complex Selector', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `#{$body}.class::hover,  
.class#id::not(.a)    a[type="button"]   , // asd
.class .class#id    `,
      '/file'
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [createSassDiagnostic('variableNotFound', createRange(0, 2, 7), '$body')],
      settings: defaultTestFileSettings,
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
            { type: 'literalValue', value: '.class::hover,' },
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
              body: [{ type: 'literalValue', value: '.a' }],
            },
            { type: 'literalValue', value: ' a[type="button"]' },
            { type: 'literalValue', value: ' ,' },
            { type: 'literalValue', value: ' // asd' },
          ],
          body: [],
        },
        {
          type: 'selector',
          level: 0,
          line: 2,
          value: [
            { type: 'literalValue', value: '.class' },
            { type: 'literalValue', value: ' .class#id' },
          ],
          body: [],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toBe(
    `#{$body}.class::hover,
.class#id::not(.a) a[type="button"] , // asd
.class .class#id`
  );
});
