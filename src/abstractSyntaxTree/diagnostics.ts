import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { Pluralize } from '../utils';

export interface SassDiagnostic extends Diagnostic {
  isResolvedByStringify: boolean;
}

const source = 'sass';

interface SassAllDiagnosticProp extends Omit<SassDiagnostic, 'range'> {
  code: keyof AllDiagnostics;
}

interface AllDiagnostics {
  '@useNotTopLevel': () => SassAllDiagnosticProp;
  invalidIndentation: (
    level: number,
    tabSize: number,
    insertSpaces: boolean
  ) => SassAllDiagnosticProp;
  variableNotFound: (name: string) => SassAllDiagnosticProp;
}

const allDiagnostics: AllDiagnostics = {
  '@useNotTopLevel': () => ({
    isResolvedByStringify: true,
    message:
      '@use rules must come before any rules other than @forward, including style rules. However, you can declare variables before @use rules to use when configuring modules.',
    code: '@useNotTopLevel',
    severity: DiagnosticSeverity.Error,
    source,
  }),
  invalidIndentation: (level, tabSize, insertSpaces) => {
    const expectedIndentation = level * tabSize;
    return {
      isResolvedByStringify: true,
      message: `Invalid Indentation Expected ${expectedIndentation} ${Pluralize(
        insertSpaces ? 'space' : 'tab',
        expectedIndentation
      )}`,
      code: 'invalidIndentation',
      severity: DiagnosticSeverity.Error,
      source,
    };
  },
  variableNotFound: (name) => ({
    isResolvedByStringify: false,
    code: 'variableNotFound',
    message: `Variable declaration for ${name} not found.`,
    severity: DiagnosticSeverity.Error,
  }),
};

export function createSassDiagnostic<K extends keyof AllDiagnostics>(
  type: K,
  range: Diagnostic['range'],
  ...args: Parameters<AllDiagnostics[K]>
): SassDiagnostic {
  return {
    ...(allDiagnostics[type] as any)(...args),
    range,
  };
}

export function createRange(line: number, startChar: number, endChar: number) {
  return {
    start: { character: startChar, line },
    end: { character: endChar, line },
  };
}
