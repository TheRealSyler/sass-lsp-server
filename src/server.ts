import {
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  IConnection,
  ClientCapabilities,
  NotificationHandler,
  DidChangeConfigurationParams,
  createConnection,
  ProposedFeatures,
} from 'vscode-languageserver';

import { completion } from './languageFeatures/completion/completion';
import { AbstractSyntaxTree } from './abstractSyntaxTree/abstractSyntaxTree';
import {
  LSPServerSettings,
  defaultLSPServerSettings,
  FileSettings,
  defaultFileSettings,
} from './defaultSettingsAndInterfaces';

export function CreateServer() {
  new SassLspServer(createConnection(ProposedFeatures.all));
}
export class SassLspServer {
  hasConfigurationCapability = false;

  hasDiagnosticRelatedInformationCapability = false;

  globalSettings: LSPServerSettings = defaultLSPServerSettings;

  ast = new AbstractSyntaxTree();

  constructor(public connection: IConnection) {
    connection.onInitialize(this.onInitialize);
    connection.onInitialized(this.onInitialized);
    connection.onDidChangeConfiguration(this.onDidChangeConfiguration);
    connection.onCompletion(completion);
    connection.onDidOpenTextDocument(async ({ textDocument }) => {
      await this.ast.parse(textDocument, await this.getDocumentEditorSettings(textDocument.uri));
    });
    // TODO finish implementing onDidChangeDocument
    connection.onDidChangeTextDocument(async ({ contentChanges, textDocument }) => {
      for (let i = 0; i < contentChanges.length; i++) {
        const change = contentChanges[i];
        const settings = await this.getDocumentEditorSettings(textDocument.uri);
        if ('range' in change && (await this.ast.lookUpFile(textDocument.uri, settings))) {
          const nodes = this.ast.files[textDocument.uri].body;

          this.ast.parse(
            {
              startLine: change.range.start.line,
              endLine: change.range.end.line,
              nodes: nodes,
              text: change.text,
              uri: textDocument.uri,
            },
            settings
          );
        } else {
          this.ast.parse({ text: change.text, uri: textDocument.uri }, settings);
        }
      }
    });

    connection.listen();
  }

  private onInitialize = ({ capabilities }: InitializeParams): InitializeResult => {
    this.hasConfigurationCapability = this.getHasConfigurationCapability(capabilities);

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
    return result;
  };

  private onInitialized = () => {
    if (this.hasConfigurationCapability) {
      this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
  };

  private onDidChangeConfiguration: NotificationHandler<DidChangeConfigurationParams> = (
    change
  ) => {
    this.connection.console.log(JSON.stringify(change, null, 2));
    this.globalSettings = <LSPServerSettings>(change.settings.sass || defaultLSPServerSettings);
  };

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
