import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';

test('AST: Mixin', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `=mx1
  margin: 20px
=mx2($arg1)
  margin: $arg1
@mixin mx3 ($arg1: "$nonExistentVar")
@mixin mx4 ($arg1:   $nonExistentVar)`,
    `/file`,
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(5, 21, 36), '$nonExistentVar'),
      ],
      body: [
        {
          type: 'mixin',
          args: [],
          level: 0,
          line: 0,
          value: 'mx1',
          mixinType: '=',
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              value: [{ type: 'literal', value: 'margin' }],
              body: [{ type: 'literal', value: '20px' }],
            },
          ],
        },
        {
          type: 'mixin',
          level: 0,
          line: 2,
          mixinType: '=',
          value: 'mx2',
          args: [{ body: null, value: '$arg1' }],
          body: [
            {
              type: 'property',
              level: 1,
              line: 3,
              value: [{ type: 'literal', value: 'margin' }],
              body: [{ type: 'variableRef', value: '$arg1', ref: { uri: '/file', line: 2 } }],
            },
          ],
        },
        {
          type: 'mixin',
          level: 0,
          line: 4,
          mixinType: '@mixin',
          value: 'mx3',
          args: [{ body: [{ type: 'literal', value: '"$nonExistentVar"' }], value: '$arg1' }],
          body: [],
        },
        {
          type: 'mixin',
          level: 0,
          line: 5,
          mixinType: '@mixin',
          value: 'mx4',
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

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toEqual(`=mx1
  margin: 20px
=mx2($arg1)
  margin: $arg1
@mixin mx3($arg1: "$nonExistentVar")
@mixin mx4($arg1: $nonExistentVar)`);
});
