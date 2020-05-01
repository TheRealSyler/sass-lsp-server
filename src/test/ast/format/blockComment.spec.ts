import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';

test('Sass Format: Block Comment', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `/**
* @comment  
      * test Comment text.  
 		   			*
  
 *
 */
`,
    '/file',
    { insertSpaces: false, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          type: 'blockComment',
          level: 0,
          line: 0,
          body: [
            { line: 0, value: '/**' },
            { line: 1, value: ' * @comment' },
            { line: 2, value: ' * test Comment text.' },
            { line: 3, value: ' *' },
            { line: 4, value: '' },
            { line: 5, value: ' *' },
            { line: 6, value: ' */' },
          ],
        },
        { type: 'emptyLine', line: 7 },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: false, tabSize: 2 })).toBe(`/**
 * @comment
 * test Comment text.
 *

 *
 */
`);
});
