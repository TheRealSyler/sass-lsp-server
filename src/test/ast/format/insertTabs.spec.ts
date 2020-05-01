import { AbstractSyntaxTree } from '../../../abstractSyntaxTree/abstractSyntaxTree';

test('Sass Format: Insert tabs', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `
  


  

  
    .test
    margin: 234px      
    -moz-animation:             abs()
  
  .test2
    max-width: 23px  
`,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );
  expect(await ast.stringifyFile('/file', { insertSpaces: false, tabSize: 2 })).toEqual(
    `
.test
	margin: 234px
	-moz-animation: abs()

	.test2
		max-width: 23px
`
  );
});
