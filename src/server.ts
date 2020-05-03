import {
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  IConnection,
  ClientCapabilities,
  NotificationHandler,
  DidChangeConfigurationParams,
} from 'vscode-languageserver';

import { completion } from './languageFeatures/completion/completion';
import { AbstractSyntaxTree } from './abstractSyntaxTree/abstractSyntaxTree';

export interface LSPServerSettings {
  maxNumberOfProblems: number;
}
export type FileSettings = {
  tabSize: number;
  insertSpaces: boolean;
};

export const defaultFileSettings: FileSettings = {
  insertSpaces: false,
  tabSize: 2,
};

export const defaultLSPServerSettings: LSPServerSettings = {
  maxNumberOfProblems: 1000,
};
export class SassLspServer {
  hasConfigurationCapability = false;
  hasWorkspaceFolderCapability = false;
  hasDiagnosticRelatedInformationCapability = false;

  globalSettings: LSPServerSettings = defaultLSPServerSettings;

  ast = new AbstractSyntaxTree();

  constructor(public connection: IConnection) {
    connection.onInitialize(this.onInitialize);
    connection.onInitialized(this.onInitialized);
    connection.onDidChangeConfiguration(this.onDidChangeConfiguration);
    connection.onCompletion(completion);
    connection.onDidOpenTextDocument(async ({ textDocument }) => {
      console.log('SERVER ON OPEN', textDocument);
      await this.ast.parseFile(
        textDocument,
        await this.getDocumentEditorSettings(textDocument.uri)
      );
    });

    connection.listen();
  }

  private onInitialize = (params: InitializeParams): InitializeResult => {
    let capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    this.hasConfigurationCapability = this.getHasConfigurationCapability(capabilities);
    this.hasWorkspaceFolderCapability = this.getHasWorkspaceFolderCapability(capabilities);
    this.hasDiagnosticRelatedInformationCapability = this.getHasDiagnosticRelatedInformationCapability(
      capabilities
    );

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: {
          resolveProvider: false,
        },
      },
    };
    if (this.hasWorkspaceFolderCapability) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      };
    }
    return result;
  };

  private onInitialized = () => {
    if (this.hasConfigurationCapability) {
      // Register for all configuration changes.
      this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (this.hasWorkspaceFolderCapability) {
      this.connection.workspace.onDidChangeWorkspaceFolders((_event) => {
        this.connection.console.log('Workspace folder change event received.');
      });
    }
  };

  private onDidChangeConfiguration: NotificationHandler<DidChangeConfigurationParams> = (
    change
  ) => {
    this.globalSettings = <LSPServerSettings>(
      (change.settings.languageServerExample || defaultLSPServerSettings)
    );
  };

  private getHasWorkspaceFolderCapability(capabilities: ClientCapabilities): boolean {
    return !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
  }

  private getHasConfigurationCapability(capabilities: ClientCapabilities): boolean {
    return !!(capabilities.workspace && !!capabilities.workspace.configuration);
  }

  private getHasDiagnosticRelatedInformationCapability(capabilities: ClientCapabilities): boolean {
    return !!(
      capabilities.textDocument &&
      capabilities.textDocument.publishDiagnostics &&
      capabilities.textDocument.publishDiagnostics.relatedInformation
    );
  }

  private async getDocumentEditorSettings(uri: string): Promise<FileSettings> {
    console.log('SERVER GET CON', uri);
    if (!this.hasConfigurationCapability) {
      return defaultFileSettings;
    }

    return {
      ...defaultFileSettings,
      ...(await this.connection.workspace.getConfiguration({
        scopeUri: uri,
        section: 'editor',
      })),
    };
  }
}
