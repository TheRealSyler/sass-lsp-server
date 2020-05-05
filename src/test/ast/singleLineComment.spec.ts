import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('Single line Comment', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `.class  // class comment
    // Line comment
  margin:   20px   // prop comment $var  `,
      '/file'
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'selector',
          level: 0,
          line: 0,
          value: [
            { type: 'literalValue', value: '.class' },
            { type: 'literalValue', value: ' // class comment' },
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
              value: [{ type: 'literalValue', value: 'margin' }],
              body: [
                { type: 'literalValue', value: '20px' },
                { type: 'literalValue', value: ' // prop comment $var' },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', defaultTestFileSettings)).toBe(`.class // class comment
  // Line comment
  margin: 20px  // prop comment $var`);
});
