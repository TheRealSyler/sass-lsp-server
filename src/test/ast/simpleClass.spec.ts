import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Simple Class', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem('.class\n  margin: 20px\n  &:hover\n    color: red', '/file'),
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
          name: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              name: [{ type: 'literalValue', value: 'margin' }],
              type: 'property',
              value: [{ type: 'literalValue', value: '20px' }],
            },
            {
              line: 2,
              level: 1,
              body: [
                {
                  level: 2,
                  line: 3,
                  type: 'property',
                  name: [{ type: 'literalValue', value: 'color' }],
                  value: [{ type: 'literalValue', value: 'red' }],
                },
              ],
              name: [{ type: 'literalValue', value: '&:hover' }],
              type: 'selector',
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
