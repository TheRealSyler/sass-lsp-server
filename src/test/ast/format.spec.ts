import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createDocumentItem, defaultTestFileSettings } from '../utils';

test('AST: Format', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parse(
    createDocumentItem(
      `@use "./files/import2"
@use ./files/import4 as test
$var: calc(   100vh - 20px)
.class
  @import ./files/import3.sass
margin-top:  calc( #{ $var } - 20px) 
              margin-left:    $var3  
   margin-right:  import2.$var2 
  margin-bottom:test.$var4
`,
      `${__dirname}/file.sass`
    ),
    defaultTestFileSettings
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    [`${__dirname}/files/import2.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var2',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/files/import3.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var3',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/files/import4.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'variable',
          level: 0,
          line: 0,
          value: '$var4',
          body: [{ type: 'literalValue', value: '20px' }],
        },
      ],
    },
    [`${__dirname}/file.sass`]: {
      diagnostics: [],
      settings: defaultTestFileSettings,
      body: [
        {
          type: 'use',
          line: 0,
          namespace: 'import2',
          uri: `${__dirname}/files/import2.sass`,
          value: './files/import2',
        },
        {
          type: 'use',
          line: 1,
          namespace: 'test',
          uri: `${__dirname}/files/import4.sass`,
          value: './files/import4',
        },
        {
          type: 'variable',
          level: 0,
          line: 2,
          value: '$var',
          body: [
            {
              type: 'expression',
              expressionType: 'func',
              funcName: 'calc',
              body: [
                { type: 'literalValue', value: '100vh' },
                { type: 'literalValue', value: '-' },
                { type: 'literalValue', value: '20px' },
              ],
            },
          ],
        },
        {
          type: 'selector',
          level: 0,
          line: 3,
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              type: 'import',
              level: 1,
              line: 4,
              uri: `${__dirname}/files/import3.sass`,
              value: './files/import3.sass',
            },
            {
              type: 'property',
              level: 1,
              line: 5,
              value: [{ type: 'literalValue', value: 'margin-top' }],
              body: [
                {
                  type: 'expression',
                  body: [
                    {
                      type: 'expression',
                      expressionType: 'interpolated',
                      body: [
                        {
                          type: 'variableRef',
                          ref: { uri: `${__dirname}/file.sass`, line: 2 },
                          value: '$var',
                        },
                      ],
                    },
                    { type: 'literalValue', value: '-' },
                    { type: 'literalValue', value: '20px' },
                  ],
                  expressionType: 'func',
                  funcName: 'calc',
                },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 6,
              value: [{ type: 'literalValue', value: 'margin-left' }],
              body: [
                {
                  type: 'variableRef',
                  ref: { uri: `${__dirname}/files/import3.sass`, line: 0 },
                  value: '$var3',
                },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 7,
              value: [{ type: 'literalValue', value: 'margin-right' }],
              body: [
                {
                  type: 'variableRef',
                  ref: { uri: `${__dirname}/files/import2.sass`, line: 0 },
                  value: 'import2.$var2',
                },
              ],
            },
            {
              type: 'property',
              level: 1,
              line: 8,
              value: [{ type: 'literalValue', value: 'margin-bottom' }],
              body: [
                {
                  type: 'variableRef',
                  ref: { uri: `${__dirname}/files/import4.sass`, line: 0 },
                  value: 'test.$var4',
                },
              ],
            },
            { type: 'emptyLine', line: 9 },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile(`${__dirname}/file.sass`, defaultTestFileSettings))
    .toEqual(`@use './files/import2'
@use './files/import4' as test
$var: calc(100vh - 20px)
.class
  @import './files/import3.sass'
  margin-top: calc(#{$var} - 20px)
  margin-left: $var3
  margin-right: import2.$var2
  margin-bottom: test.$var4
`);
});
