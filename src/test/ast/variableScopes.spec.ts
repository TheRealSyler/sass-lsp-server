import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createSassDiagnostic, createRange } from '../../abstractSyntaxTree/diagnostics';

test('AST: Variable Scopes', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `$var: 1px
$notUsedVar: none
.class
  $var2: 2px
  &:hover
    $var3: 3px
    $notUsedVar: none
.class2
  $var4: 4px
  margin: $var $var2 $var3 $var4`,
    '/file',
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [
        createSassDiagnostic('variableNotFound', createRange(9, 15, 20), '$var2'),
        createSassDiagnostic('variableNotFound', createRange(9, 21, 26), '$var3'),
      ],
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var',
          body: [{ type: 'literal', value: '1px' }],
        },
        {
          type: 'variable',
          level: 0,
          line: 1,
          value: '$notUsedVar',
          body: [{ type: 'literal', value: 'none' }],
        },
        {
          line: 2,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              type: 'variable',
              level: 1,
              line: 3,
              value: '$var2',
              body: [{ type: 'literal', value: '2px' }],
            },

            {
              line: 4,
              level: 1,
              value: [{ type: 'literal', value: '&:hover' }],
              type: 'selector',
              body: [
                {
                  type: 'variable',
                  level: 2,
                  line: 5,
                  value: '$var3',
                  body: [{ type: 'literal', value: '3px' }],
                },
                {
                  type: 'variable',
                  level: 2,
                  line: 6,
                  value: '$notUsedVar',
                  body: [{ type: 'literal', value: 'none' }],
                },
              ],
            },
          ],
        },
        {
          type: 'selector',
          level: 0,
          line: 7,
          value: [{ type: 'literal', value: '.class2' }],
          body: [
            {
              type: 'variable',
              level: 1,
              line: 8,
              value: '$var4',
              body: [{ type: 'literal', value: '4px' }],
            },
            {
              type: 'property',
              level: 1,
              line: 9,
              value: [{ type: 'literal', value: 'margin' }],
              body: [
                { type: 'variableRef', ref: { line: 0, uri: '/file' }, value: '$var' },
                { type: 'variableRef', ref: null, value: '$var2' },
                { type: 'variableRef', ref: null, value: '$var3' },
                { type: 'variableRef', ref: { line: 8, uri: '/file' }, value: '$var4' },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
