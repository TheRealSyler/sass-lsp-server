import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('AST: Simple Import', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    '@import "./files/import1"\n.class\n  margin: $var',
    `${__dirname}/file.sass`,
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    [`${__dirname}/files/import1.sass`]: {
      diagnostics: [],
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var',
          body: [{ type: 'literal', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/file.sass`]: {
      diagnostics: [],
      body: [
        {
          type: 'import',
          level: 0,
          line: 0,
          uri: `${__dirname}/files/import1.sass`,
          value: './files/import1',
        },
        {
          line: 1,
          level: 0,
          type: 'selector',
          value: [{ type: 'literal', value: '.class' }],
          body: [
            {
              line: 2,
              level: 1,
              value: [{ type: 'literal', value: 'margin' }],
              type: 'property',
              body: [
                {
                  type: 'variableRef',
                  value: '$var',
                  ref: {
                    uri: `${__dirname}/files/import1.sass`,
                    line: 0,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
