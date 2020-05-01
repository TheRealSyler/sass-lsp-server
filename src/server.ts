/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  ProposedFeatures,
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

interface ServerSettings {
  maxNumberOfProblems: number;
}

class Server {
  hasConfigurationCapability = false;
  hasWorkspaceFolderCapability = false;
  hasDiagnosticRelatedInformationCapability = false;

  defaultSettings: ServerSettings = { maxNumberOfProblems: 1000 };
  globalSettings: ServerSettings = this.defaultSettings;
  // Cache the settings of all open documents
  documentSettings: Map<string, Thenable<ServerSettings>> = new Map();

  ast = new AbstractSyntaxTree();

  constructor(public connection: IConnection) {
    connection.onInitialize(this.onInitialize);
    connection.onInitialized(this.onInitialized);
    connection.onDidChangeConfiguration(this.onDidChangeConfiguration);
    connection.onCompletion(completion);
    connection.onCompletionResolve((item) => item);

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
        // Tell the client that the server supports code completion
        completionProvider: {
          resolveProvider: true,
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
    if (this.hasConfigurationCapability) {
      // Reset all cached document settings
      this.documentSettings.clear();
    } else {
      this.globalSettings = <ServerSettings>(
        (change.settings.languageServerExample || this.defaultSettings)
      );
    }

    // Revalidate all open text documents
    // documents.all().forEach(validateTextDocument);
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
}

const server = new Server(createConnection(ProposedFeatures.all));

// // Create a connection for the server. The connection uses Node's IPC as a transport.
// // Also include all preview / proposed LSP features.
// let connection = createConnection(ProposedFeatures.all);

// // Create a simple text document manager. The text document manager
// // supports full document sync only
// let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// let hasConfigurationCapability: boolean = false;
// let hasWorkspaceFolderCapability: boolean = false;
// let hasDiagnosticRelatedInformationCapability: boolean = false;

// connection.onInitialize((params: InitializeParams) => {
//   let capabilities = params.capabilities;

//   // Does the client support the `workspace/configuration` request?
//   // If not, we will fall back using global settings
//   hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
//   hasWorkspaceFolderCapability = !!(
//     capabilities.workspace && !!capabilities.workspace.workspaceFolders
//   );
//   hasDiagnosticRelatedInformationCapability = !!(
//     capabilities.textDocument &&
//     capabilities.textDocument.publishDiagnostics &&
//     capabilities.textDocument.publishDiagnostics.relatedInformation
//   );

//   const result: InitializeResult = {
//     capabilities: {
//       textDocumentSync: TextDocumentSyncKind.Incremental,
//       // Tell the client that the server supports code completion
//       completionProvider: {
//         resolveProvider: true,
//       },
//     },
//   };
//   if (hasWorkspaceFolderCapability) {
//     result.capabilities.workspace = {
//       workspaceFolders: {
//         supported: true,
//       },
//     };
//   }
//   return result;
// });

// connection.onInitialized(() => {
//   if (hasConfigurationCapability) {
//     // Register for all configuration changes.
//     connection.client.register(DidChangeConfigurationNotification.type, undefined);
//   }
//   if (hasWorkspaceFolderCapability) {
//     connection.workspace.onDidChangeWorkspaceFolders((_event) => {
//       connection.console.log('Workspace folder change event received.');
//     });
//   }
// });

// // The example settings
// interface ExampleSettings {
//   maxNumberOfProblems: number;
// }

// // The global settings, used when the `workspace/configuration` request is not supported by the client.
// // Please note that this is not the case when using this server with the client provided in this example
// // but could happen with other clients.
// const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
// let globalSettings: ExampleSettings = defaultSettings;

// const ast = new AbstractSyntaxTree();

// // Cache the settings of all open documents
// let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

// connection.onDidChangeConfiguration((change) => {
//   if (hasConfigurationCapability) {
//     // Reset all cached document settings
//     documentSettings.clear();
//   } else {
//     globalSettings = <ExampleSettings>(change.settings.languageServerExample || defaultSettings);
//   }

//   // Revalidate all open text documents
//   documents.all().forEach(validateTextDocument);
// });

// function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
//   if (!hasConfigurationCapability) {
//     return Promise.resolve(globalSettings);
//   }
//   let result = documentSettings.get(resource);
//   if (!result) {
//     result = connection.workspace.getConfiguration({
//       scopeUri: resource,
//       section: 'languageServerExample',
//     });
//     documentSettings.set(resource, result);
//   }
//   return result;
// }

// // Only keep settings for open documents
// documents.onDidClose((e) => {
//   documentSettings.delete(e.document.uri);
// });

// // The content of a text document has changed. This event is emitted
// // when the text document first opened or when its content has changed.
// documents.onDidChangeContent((change) => {
//   validateTextDocument(change.document);
// });

// async function validateTextDocument(textDocument: TextDocument): Promise<void> {
//   // In this simple example we get the settings for every validate run.
//   let settings = await getDocumentSettings(textDocument.uri);

//   // The validator creates diagnostics for all uppercase words length 2 and more
//   let text = textDocument.getText();
//   let pattern = /\b[A-Z]{2,}\b/g;
//   let m: RegExpExecArray | null;

//   let problems = 0;
//   let diagnostics: Diagnostic[] = [];
//   while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
//     problems++;
//     let diagnostic: Diagnostic = {
//       severity: DiagnosticSeverity.Warning,
//       range: {
//         start: textDocument.positionAt(m.index),
//         end: textDocument.positionAt(m.index + m[0].length),
//       },
//       message: `${m[0]} is all uppercase.`,
//       source: 'ex',
//     };
//     if (hasDiagnosticRelatedInformationCapability) {
//       diagnostic.relatedInformation = [
//         {
//           location: {
//             uri: textDocument.uri,
//             range: Object.assign({}, diagnostic.range),
//           },
//           message: 'Spelling matters',
//         },
//         {
//           location: {
//             uri: textDocument.uri,
//             range: Object.assign({}, diagnostic.range),
//           },
//           message: 'Particularly for names',
//         },
//       ];
//     }
//     diagnostics.push(diagnostic);
//   }

//   // Send the computed diagnostics to VSCode.
//   connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
// }

// connection.onDidChangeWatchedFiles((_change) => {
//   // Monitored files have change in VSCode
//   connection.console.log('We received an file change event');
// });

// connection.onCompletion(completion);
// connection.onCompletionResolve((item) => item);

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
// documents.listen(connection);

// Listen on the connection
// connection.listen();
