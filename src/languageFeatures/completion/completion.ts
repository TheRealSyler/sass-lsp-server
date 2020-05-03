import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
} from 'vscode-languageserver';

export const completion = (pos: TextDocumentPositionParams): CompletionItem[] => {
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
