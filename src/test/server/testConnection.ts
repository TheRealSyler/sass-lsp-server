import { IConnection, ConfigurationItem } from 'vscode-languageserver';
import { defaultTestFileSettings } from '../utils';
import { FileSettings } from '../../defaultSettingsAndInterfaces';

interface TestConfig {
  editor: FileSettings;
}

type ConnectionFuncs = keyof Omit<
  IConnection,
  'console' | 'window' | 'workspace' | 'client' | 'tracer' | 'telemetry' | 'languages'
>;

type ConnectionFuncParams<T extends ConnectionFuncs> = Parameters<IConnection[T]>[0] extends (
  ...args: any[]
) => any
  ? Parameters<Parameters<IConnection[T]>[0]>[0]
  : Parameters<IConnection[T]>[0];

interface TestConnectionController {
  onDidOpenTextDocument: (p: ConnectionFuncParams<'onDidOpenTextDocument'>) => void;
  onDidChangeTextDocument: (p: ConnectionFuncParams<'onDidChangeTextDocument'>) => void;
  onInitialize: (p: ConnectionFuncParams<'onInitialize'>) => void;
  onDidChangeConfiguration: (p: ConnectionFuncParams<'onDidChangeConfiguration'>) => void;
  documentConfigs: {
    [key: string]: TestConfig;
  };
  globalConfig: TestConfig;
}

interface Configuration {
  getConfiguration(): Promise<any>;
  getConfiguration(section: string): Promise<any>;
  getConfiguration(item: ConfigurationItem): Promise<any>;
  getConfiguration(items: ConfigurationItem[]): Promise<any[]>;
}
/**Placeholder function. */
const emptyF: () => any = () => void 0;
emptyF(); // call for codecov.

type Funcs = {
  [key in ConnectionFuncs]: (p: any) => void;
};

export function createTestConnection(): {
  controller: TestConnectionController;
  connection: IConnection;
} {
  /**Stores functions, that get assigned through the connection(aka the server). */
  const funcs = createEmptyFuncs();

  /**Connects the functions that get assigned to events by the server to the controller(which is the fake client) */
  const callFunction = (key: ConnectionFuncs) => (params: any) => {
    funcs[key](params);
  };

  /**Mimic's the client. */
  const controller: TestConnectionController = {
    onDidOpenTextDocument: callFunction('onDidOpenTextDocument'),
    onDidChangeTextDocument: callFunction('onDidChangeTextDocument'),
    onDidChangeConfiguration: callFunction('onDidChangeConfiguration'),
    onInitialize: (params) => {
      funcs.onInitialize(params);
      funcs.onInitialized({});
    },
    documentConfigs: {},
    globalConfig: {
      editor: defaultTestFileSettings,
    },
  };

  /**getConfig helper function. */
  function getConfigSection(i: ConfigurationItem) {
    if (i.section) {
      return i.scopeUri
        ? controller.documentConfigs[i.scopeUri][i.section as keyof TestConfig]
        : controller.globalConfig[i.section as keyof TestConfig];
    }
    return i.scopeUri ? controller.documentConfigs[i.scopeUri] : controller.globalConfig;
  }
  /**The function that lets the server get the any config. */
  const getConfig: Configuration['getConfiguration'] = async (
    p?: string | ConfigurationItem | ConfigurationItem[]
  ) => {
    if (typeof p === 'string') {
      return controller.globalConfig[p as keyof TestConfig];
    } else if (typeof p === 'object') {
      if (Array.isArray(p)) {
        return p.map((i) => getConfigSection(i)) as any;
      } else {
        return getConfigSection(p);
      }
    }
    return controller.globalConfig;
  };
  /**Sets the funcs variable with the given key. */
  const assignFunc = (key: keyof typeof funcs) => (p: any) => {
    funcs[key] = p;
  };

  const connection: IConnection = {
    console: {
      error: emptyF,
      connection: {} as any,
      info: emptyF,
      log: emptyF,
      warn: emptyF,
    },
    client: { connection: {} as any, register: emptyF },
    languages: {
      attachPartialResultProgress: emptyF,
      attachWorkDoneProgress: emptyF,
      connection: {} as any,
    },
    telemetry: { connection: {} as any, logEvent: emptyF },
    tracer: { connection: {} as any, log: emptyF },
    window: {
      attachWorkDoneProgress: emptyF,
      connection: {} as any,
      createWorkDoneProgress: emptyF,
      showErrorMessage: emptyF,
      showInformationMessage: emptyF,
      showWarningMessage: emptyF,
    },
    workspace: {
      applyEdit: emptyF,
      connection: {} as any,
      getConfiguration: getConfig,
      getWorkspaceFolders: emptyF,
      onDidChangeWorkspaceFolders: emptyF,
    },
    dispose: emptyF,
    listen: emptyF,
    onCodeAction: emptyF,
    onCodeLens: emptyF,
    onCodeLensResolve: emptyF,
    onColorPresentation: emptyF,
    onCompletion: emptyF,
    onCompletionResolve: emptyF,
    onDeclaration: emptyF,
    onDefinition: emptyF,
    onDidChangeConfiguration: assignFunc('onDidChangeConfiguration'),
    onDidChangeTextDocument: assignFunc('onDidChangeTextDocument'),
    onDidChangeWatchedFiles: emptyF,
    onDidCloseTextDocument: emptyF,
    onDidOpenTextDocument: assignFunc('onDidOpenTextDocument'),
    onDidSaveTextDocument: emptyF,
    onDocumentColor: emptyF,
    onDocumentFormatting: emptyF,
    onDocumentHighlight: emptyF,
    onDocumentLinkResolve: emptyF,
    onDocumentLinks: emptyF,
    onDocumentOnTypeFormatting: emptyF,
    onDocumentRangeFormatting: emptyF,
    onDocumentSymbol: emptyF,
    onExecuteCommand: emptyF,
    onExit: emptyF,
    onFoldingRanges: emptyF,
    onHover: emptyF,
    onImplementation: emptyF,
    onInitialize: assignFunc('onInitialize'),
    onInitialized: assignFunc('onInitialized'),
    onNotification: emptyF,
    onPrepareRename: emptyF,
    onProgress: emptyF,
    onReferences: emptyF,
    onRenameRequest: emptyF,
    onRequest: emptyF,
    onSelectionRanges: emptyF,
    onShutdown: emptyF,
    onSignatureHelp: emptyF,
    onTypeDefinition: emptyF,
    onWillSaveTextDocument: emptyF,
    onWillSaveTextDocumentWaitUntil: emptyF,
    onWorkspaceSymbol: emptyF,
    sendDiagnostics: emptyF,
    sendNotification: emptyF,
    sendProgress: emptyF,
    sendRequest: emptyF,
  };
  return { controller, connection };
}

function createEmptyFuncs(): Funcs {
  return {
    dispose: emptyF,
    listen: emptyF,
    onCodeAction: emptyF,
    onCodeLens: emptyF,
    onCodeLensResolve: emptyF,
    onColorPresentation: emptyF,
    onCompletion: emptyF,
    onCompletionResolve: emptyF,
    onDeclaration: emptyF,
    onDefinition: emptyF,
    onDidChangeConfiguration: emptyF,
    onDidChangeTextDocument: emptyF,
    onDidChangeWatchedFiles: emptyF,
    onDidCloseTextDocument: emptyF,
    onDidOpenTextDocument: emptyF,
    onDidSaveTextDocument: emptyF,
    onDocumentColor: emptyF,
    onDocumentFormatting: emptyF,
    onDocumentHighlight: emptyF,
    onDocumentLinkResolve: emptyF,
    onDocumentLinks: emptyF,
    onDocumentOnTypeFormatting: emptyF,
    onDocumentRangeFormatting: emptyF,
    onDocumentSymbol: emptyF,
    onExecuteCommand: emptyF,
    onExit: emptyF,
    onFoldingRanges: emptyF,
    onHover: emptyF,
    onImplementation: emptyF,
    onInitialize: emptyF,
    onInitialized: emptyF,
    onNotification: emptyF,
    onPrepareRename: emptyF,
    onProgress: emptyF,
    onReferences: emptyF,
    onRenameRequest: emptyF,
    onRequest: emptyF,
    onSelectionRanges: emptyF,
    onShutdown: emptyF,
    onSignatureHelp: emptyF,
    onTypeDefinition: emptyF,
    onWillSaveTextDocument: emptyF,
    onWillSaveTextDocumentWaitUntil: emptyF,
    onWorkspaceSymbol: emptyF,
    sendDiagnostics: emptyF,
    sendNotification: emptyF,
    sendProgress: emptyF,
    sendRequest: emptyF,
  };
}
