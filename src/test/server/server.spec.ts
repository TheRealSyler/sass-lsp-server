import { SassLspServer } from '../../server';
import { createTestConnection } from './testConnection';
import { createDocumentItem, sleep } from '../utils';
import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';
import { createRange } from '../../abstractSyntaxTree/diagnostics';

test('Server: Server', async () => {
  const { connection, controller } = createTestConnection();
  const server = new SassLspServer(connection);

  controller.onInitialize({
    capabilities: {
      workspace: { configuration: true },
      textDocument: { publishDiagnostics: { relatedInformation: true } },
    },
    processId: 0,
    rootUri: '/',
    workspaceFolders: [],
  });

  expect(server.ast.files).toStrictEqual({});

  controller.documentConfigs['/file'] = {
    editor: { insertSpaces: true, tabSize: 4 },
  };

  controller.onDidOpenTextDocument({
    textDocument: createDocumentItem('.class\n    margin: 20px', '/file'),
  });

  await sleep(100);

  const expectedFilesAfterCreateItem: AbstractSyntaxTree['files'] = {
    '/file': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [
            {
              line: 1,
              level: 1,
              value: [{ type: 'literalValue', value: 'margin' }],
              type: 'property',
              body: [{ type: 'literalValue', value: '20px' }],
            },
          ],
        },
      ],
      diagnostics: [],
      settings: { insertSpaces: true, tabSize: 4 },
    },
  };

  expect(server.ast.files).toStrictEqual(expectedFilesAfterCreateItem);

  controller.onDidChangeTextDocument({
    textDocument: { uri: '/file', version: 1 },
    contentChanges: [
      { range: { end: { line: 2, character: 0 }, start: { line: 1, character: 0 } }, text: '' },
    ],
  });

  await sleep(100);

  const expectedFilesAfterDeleteLine: AbstractSyntaxTree['files'] = {
    '/file': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: [{ type: 'literalValue', value: '.class' }],
          body: [],
        },
      ],
      diagnostics: [],
      settings: { insertSpaces: true, tabSize: 4 },
    },
  };

  expect(server.ast.files).toStrictEqual(expectedFilesAfterDeleteLine);
});
