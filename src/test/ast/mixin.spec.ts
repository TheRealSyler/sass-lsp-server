import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Mixin', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `=mx1
  margin: 20px
=mx2($arg1)
  margin: $arg1
@mixin mx3 ($arg1: "$nonExistentVar")
@mixin mx4 ($arg1:   $nonExistentVar)`,
      `/file`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(5, 21, 36), '$nonExistentVar'),
      ],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'mixin',
          args: [],
          level: 0,
          line: 0,
          name: 'mx1',
          mixinType: '=',
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              name: [{ type: 'literalValue', value: 'margin' }],
              value: [{ type: 'literalValue', value: '20px' }],
            },
          ],
        },
        {
          type: 'mixin',
          level: 0,
          line: 2,
          mixinType: '=',
          name: 'mx2',
          args: [{ body: null, value: '$arg1' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 3,
              name: [{ type: 'literalValue', value: 'margin' }],
              value: [{ type: 'variableRef', value: '$arg1', ref: { uri: '/file', line: 2 } }],
            },
          ],
        },
        {
          type: 'mixin',
          level: 0,
          line: 4,
          mixinType: '@mixin',
          name: 'mx3',
          args: [{ body: [{ type: 'literalValue', value: '"$nonExistentVar"' }], value: '$arg1' }],
          body: [],
        },
        {
          type: 'mixin',
          level: 0,
          line: 5,
          mixinType: '@mixin',
          name: 'mx4',
          args: [
            {
              body: [{ type: 'variableRef', value: '$nonExistentVar', ref: null }],
              value: '$arg1',
            },
          ],
          body: [],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toEqual(`=mx1
  margin: 20px
=mx2($arg1)
  margin: $arg1
@mixin mx3($arg1: "$nonExistentVar")
@mixin mx4($arg1: $nonExistentVar)`);
});
