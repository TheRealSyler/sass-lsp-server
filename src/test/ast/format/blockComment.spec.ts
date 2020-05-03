import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('Sass Format: Block Comment', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    createDocumentItem(
      `/**
* @comment  
      * test Comment text.  
 		   			*
  
 *
 */
`,
      '/file'
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      settings: defaultTestFileSettings,
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

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toBe(`/**
 * @comment
 * test Comment text.
 *

 *
 */
`);
});
