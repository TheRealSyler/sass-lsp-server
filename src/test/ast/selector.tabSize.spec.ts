import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem } from '../utils';

test('AST: Selector tabSize', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(createDocumentItem('.class\n  .class\n .class', '/file1'), {
    insertSpaces: true,
    tabSize: 1,
  });
  await ast.parse(createDocumentItem('.class\n  .class\n .class', '/file2'), {
    insertSpaces: true,
    tabSize: 2,
  });
  await ast.parse(createDocumentItem('.class\n  .class\n .class', '/file12'), {
    insertSpaces: true,
    tabSize: 12,
  });

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file1': {
      diagnostics: [createSassDiagnostic('invalidIndentation', createRange(1, 2, 8), 1, 1, true)],
      settings: { insertSpaces: true, tabSize: 1 },
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
              body: [],
              value: [{ type: 'literalValue', value: '.class' }],
              type: 'selector',
            },
            {
              line: 2,
              level: 1,
              body: [],
              value: [{ type: 'literalValue', value: '.class' }],
              type: 'selector',
            },
          ],
        },
      ],
    },
    '/file2': {
      diagnostics: [],
      settings: { insertSpaces: true, tabSize: 2 },
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
              type: 'selector',
              value: [{ type: 'literalValue', value: '.class' }],
              body: [],
            },
          ],
        },
        {
          line: 2,
          level: 1,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [],
        },
      ],
    },
    '/file12': {
      diagnostics: [],
      settings: { insertSpaces: true, tabSize: 12 },
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          body: [],
          value: [{ type: 'literalValue', value: '.class' }],
        },
        {
          line: 1,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [],
        },
        {
          line: 2,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
