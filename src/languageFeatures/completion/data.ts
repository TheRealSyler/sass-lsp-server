import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

interface Prop {
  name: string;
  desc?: string;
  browsers?: string;
  body?: string;
  status?: string;
  mdn_url?: string;
  restriction?: string;
  values?: { name?: string; desc?: string; browsers?: string }[];
}

export const completionItems = {
  at: (require('./data/at.json') as typeof import('./data/at.json')).map(
    mapCompletionItem(CompletionItemKind.Function)
  ),
  comment: (require('./data/comment.json') as typeof import('./data/comment.json')).map(
    mapCompletionItem(CompletionItemKind.Property)
  ),
  globalPropValues: (require('./data/globalPropValues.json') as typeof import('./data/globalPropValues.json')).map(
    mapCompletionItem(CompletionItemKind.Function)
  ),
  // htmlTags: require('./data/htmlTags.json') as typeof import('./data/htmlTags.json'),
  modules: getModules(),
  properties: Object.values(
    require('./data/properties.json') as typeof import('./data/properties.json')
  ).map(mapPropertyCompletionItem),
  pseudo: (require('./data/pseudo.json') as typeof import('./data/pseudo.json')).map(
    mapPseudoCompletionItem
  ),
  // voidHtmlTags: require('./data/voidHtmlTags.json') as typeof import('./data/voidHtmlTags.json'),
};

function getModules() {
  const modules = require('./data/modules.json') as typeof import('./data/modules.json');
  const res: any = {
    COLOR: [],
    LIST: [],
    MAP: [],
    MATH: [],
    META: [],
    SELECTOR: [],
    STRING: [],
  };
  for (const key in modules) {
    if (modules.hasOwnProperty(key)) {
      const module = modules[key as keyof typeof modules] as Exclude<
        typeof modules[keyof typeof modules],
        never[]
      >;

      res[key] = module.map<CompletionItem>(mapCompletionItem(CompletionItemKind.Function));
    }
  }
  return res as { [key in keyof typeof modules]: CompletionItem[] };
}

function mapCompletionItem(kind: CompletionItemKind): (value: Prop) => CompletionItem {
  return (item) => {
    return {
      label: item.name,
      insertText: item.body,
      detail: item.desc,
      kind,
    };
  };
}
function mapPseudoCompletionItem(item: Prop) {
  return {
    label: item.name,
    insertText: `${item.body}\n\t$0`,
    detail: item.desc,
    kind: CompletionItemKind.Class,
  };
}

function mapPropertyCompletionItem(item: Prop): CompletionItem {
  return {
    label: item.name,
    insertText: item.name.concat(': '),
    detail: item.desc,
    tags: item.status === 'obsolete' ? [1] : [],
    documentation: GetPropertyDescription(item.name, item),
    kind: CompletionItemKind.Property,
  };
}

function GetPropertyDescription(name: string, item: Prop) {
  return (
    (item.desc
      ? `${getPropStatus(item.status)}${item.desc}${
          item.mdn_url ? `\n\n[MDN](${item.mdn_url})` : ''
        }`
      : getPropStatus(item.status)) +
    `\n\n${GoogleLink(name)}\n\n` +
    ConvertPropertyValues(item.values)
  );
}
function ConvertPropertyValues(values: Prop['values']) {
  if (values === undefined) {
    return '';
  }

  let text = '**Values**';
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    text = text.concat(
      '\n* ',
      value.name !== undefined ? '**`' + value.name + '`**' : '',
      value.desc !== undefined ? ' *' + value.desc + '*' : ''
    );
  }
  return text;
}

function getPropStatus(status?: string) {
  switch (status) {
    case 'standard':
      return 'This Property is **`Standard`**';
    case 'nonstandard':
      return '⚠️ **Attention** this Property is **`nonStandard`**.\n\n';
    case 'experimental':
      return '⚠️ **Attention** this Property is **`Experimental`**.\n\n';
    case 'obsolete':
      return '⛔️ **Attention** this Property is **`Obsolete`**.\n\n';
    default:
      return 'No Status Data Available.\n\n';
  }
}
function GoogleLink(search: string) {
  return `[Google](https://www.google.com/search?q=css+${search})`;
}
