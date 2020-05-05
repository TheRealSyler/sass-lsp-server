import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../../utils';

test('@font-face', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `
		/**
    * Comment
 */
		@font-face
    margin: 200px
    `,
      '/file'
    ),
    defaultTestFileSettings
  );
  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toBe(`
    /**
     * Comment
     */
@font-face
  margin: 200px
`);
});
