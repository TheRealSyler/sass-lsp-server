import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('Sass Format: Block Comment', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
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
            { line: 0, value: '/**', type: 'blockCommentContent' },
            { line: 1, value: ' * @comment', type: 'blockCommentContent' },
            { line: 2, value: ' * test Comment text.', type: 'blockCommentContent' },
            { line: 3, value: ' *', type: 'blockCommentContent' },
            { line: 4, value: '', type: 'blockCommentContent' },
            { line: 5, value: ' *', type: 'blockCommentContent' },
            { line: 6, value: ' */', type: 'blockCommentContent' },
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
