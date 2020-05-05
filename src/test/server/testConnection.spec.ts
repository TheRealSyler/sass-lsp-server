import { createTestConnection } from './testConnection';
import { defaultTestFileSettings, sleep } from '../utils';
import { InitializeResult } from 'vscode-languageserver';

function InitConnection() {
  const { connection, controller } = createTestConnection();

  const File1Settings = { insertSpaces: true, tabSize: 7 };
  controller.documentConfigs['/file'] = {
    editor: File1Settings,
  };
  return { connection, controller, File1Settings };
}

test('Server: TestConnection getConfig no params', async () => {
  const { connection } = InitConnection();
  expect(await connection.workspace.getConfiguration()).toStrictEqual({
    editor: defaultTestFileSettings,
  });
});
test('Server: TestConnection getConfig string param', async () => {
  const { connection } = InitConnection();
  expect(await connection.workspace.getConfiguration('editor')).toStrictEqual(
    defaultTestFileSettings
  );
});
test('Server: TestConnection getConfig item param {}', async () => {
  const { connection } = InitConnection();
  expect(await connection.workspace.getConfiguration({})).toStrictEqual({
    editor: defaultTestFileSettings,
  });
});
test("Server: TestConnection getConfig item param { scopeUri: '/file' }", async () => {
  const { connection, File1Settings } = InitConnection();
  expect(await connection.workspace.getConfiguration({ scopeUri: '/file' })).toStrictEqual({
    editor: File1Settings,
  });
});
test("Server: TestConnection getConfig item param { section: 'editor' }", async () => {
  const { connection } = InitConnection();
  expect(await connection.workspace.getConfiguration({ section: 'editor' })).toStrictEqual(
    defaultTestFileSettings
  );
});
test("Server: TestConnection getConfig item param { scopeUri: '/file', section: 'editor' }", async () => {
  const { connection, File1Settings } = InitConnection();
  expect(
    await connection.workspace.getConfiguration({ scopeUri: '/file', section: 'editor' })
  ).toStrictEqual(File1Settings);
});

test("Server: TestConnection getConfig item param [{ scopeUri: '/file', section: 'editor' }, non existent file]", async () => {
  const { connection, File1Settings } = InitConnection();
  expect(
    await connection.workspace.getConfiguration([
      { scopeUri: '/file', section: 'editor' },
      { scopeUri: '/nonExistentFile' },
    ])
  ).toStrictEqual([File1Settings, undefined]);
});
test('Server: TestConnection getConfig non Existent Section', async () => {
  const { connection } = InitConnection();
  expect(await connection.workspace.getConfiguration('THE_NON_EXISTENT_SECTION')).toStrictEqual(
    undefined
  );
});
test('Server: TestConnection onDidOpenTextDocument', async () => {
  const { connection, controller } = InitConnection();
  const file1DocItem = { languageId: 'sass', text: '.class\n', uri: '/file', version: 0 };
  connection.onDidOpenTextDocument((p) => {
    expect(p.textDocument).toStrictEqual(file1DocItem);
  });
  controller.onDidOpenTextDocument({
    textDocument: file1DocItem,
  });
});
test('Server: TestConnection onDidChangeTextDocument', async () => {
  const { connection, controller } = InitConnection();
  const file1DocItem = { languageId: 'sass', text: '.class\n', uri: '/file', version: 0 };
  const contentChange = [
    { range: { start: { character: 10, line: 0 }, end: { character: 0, line: 1 } }, text: '' },
  ];
  connection.onDidChangeTextDocument((p) => {
    expect(p.textDocument).toStrictEqual(file1DocItem);
    expect(p.contentChanges).toStrictEqual(contentChange);
  });
  controller.onDidChangeTextDocument({
    textDocument: file1DocItem,
    contentChanges: contentChange,
  });
});
test('Server: TestConnection Initialize', async () => {
  const { connection, controller } = InitConnection();
  connection.onInitialize(async (params, cancellationToken, workDoneProgress, resultProgress) => {
    expect(params.capabilities).toStrictEqual({ workspace: { configuration: true } });
    const res: InitializeResult = { capabilities: {} };
    return res;
  });
  controller.onInitialize({
    capabilities: { workspace: { configuration: true } },
    processId: 0,
    rootUri: '/',
    workspaceFolders: [],
  });
});
test('Server: TestConnection OnDidChangeConfiguration', async () => {
  const { connection, controller } = InitConnection();

  connection.onInitialize(async (params) => {
    expect(params.capabilities).toStrictEqual({ workspace: { configuration: true } });
    const res: InitializeResult = { capabilities: {} };
    return res;
  });

  controller.onInitialize({
    capabilities: { workspace: { configuration: true } },
    processId: 0,
    rootUri: '/',
    workspaceFolders: [],
  });

  connection.onDidChangeConfiguration((p) => {
    expect(p.settings).toStrictEqual({ a: 2 });
  });

  controller.onDidChangeConfiguration({ settings: { a: 2 } });
});
