import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Mixin Variable Declaration Shadowing.', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `$test: 23
@mixin name ( $test, $test2: 'as,"$123"', $test: 20px )
  left: $test`,
      `/file`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      settings: defaultTestFileSettings,
      diagnostics: [],
      body: [
        {
          type: 'variable',
          line: 0,
          body: [{ type: 'literalValue', value: '23' }],
          level: 0,
          value: '$test',
        },
        {
          type: 'mixin',
          mixinType: '@mixin',
          level: 0,
          line: 1,
          value: 'name',
          args: [
            { body: null, value: '$test' },
            { body: [{ type: 'literalValue', value: '\'as,"$123"\'' }], value: '$test2' },
            { body: [{ type: 'literalValue', value: '20px' }], value: '$test' },
          ],
          body: [
            {
              type: 'property',
              body: [
                {
                  type: 'variableRef',
                  ref: { line: 1, uri: '/file' },
                  value: '$test',
                },
              ],
              level: 1,
              line: 2,
              value: [{ type: 'literalValue', value: 'left' }],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
