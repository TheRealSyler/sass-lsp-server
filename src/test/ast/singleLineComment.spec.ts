import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('Single line Comment', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `.class  // class comment
    // Line comment
  margin:   20px   // prop comment $var  `,
    '/file',
    { insertSpaces: false, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          type: 'selector',
          level: 0,
          line: 0,
          value: [
            { type: 'literal', value: '.class' },
            { type: 'literal', value: ' // class comment' },
          ],
          body: [
            {
              type: 'comment',
              level: 1,
              line: 1,
              value: '// Line comment',
            },
            {
              type: 'property',
              level: 1,
              line: 2,
              value: [{ type: 'literal', value: 'margin' }],
              body: [
                { type: 'literal', value: '20px' },
                { type: 'literal', value: ' // prop comment $var' },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 }))
    .toBe(`.class // class comment
  // Line comment
  margin: 20px  // prop comment $var`);
});
