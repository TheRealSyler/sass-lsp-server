import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
} from 'vscode-languageserver';

// This handler provides the initial list of the completion items.
export const completion = (pos: TextDocumentPositionParams): CompletionItem[] => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: '"""""TEST AWD"""""',
      kind: CompletionItemKind.Text,
      data: 1,
    },
    {
      label: 'TEST 2',
      kind: CompletionItemKind.Text,
      data: 2,
    },
  ];
};
