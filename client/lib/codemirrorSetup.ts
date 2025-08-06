import { Extension } from '@codemirror/state';
import { EditorView, keymap, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { foldGutter, indentOnInput, bracketMatching, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';

/**
 * Custom basic setup for CodeMirror with essential features
 */
export const customBasicSetup: Extension = [
  history(),
  foldGutter(),
  dropCursor(),
  drawSelection(),
  rectangularSelection(),
  crosshairCursor(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ])
];

/**
 * Get language extension for CodeMirror based on language string
 */
export function getLanguageExtension(language: string): Extension {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return javascript();
    case 'typescript':
    case 'ts':
      return javascript({ typescript: true });
    case 'python':
    case 'py':
      return python();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'scss':
    case 'sass':
      return css();
    case 'json':
      return json();
    case 'markdown':
    case 'md':
      return markdown();
    case 'xml':
      return xml();
    default:
      return javascript(); // Default fallback
  }
}

/**
 * Safely combine multiple extensions, filtering out null/undefined values
 */
export function combineExtensions(...extensions: (Extension | Extension[] | null | undefined)[]): Extension[] {
  const combined: Extension[] = [];
  
  for (const ext of extensions) {
    if (ext == null) continue;
    
    if (Array.isArray(ext)) {
      combined.push(...ext.filter(e => e != null));
    } else {
      combined.push(ext);
    }
  }
  
  return combined;
}

/**
 * Theme configurations
 */
export const themeConfig = {
  dark: {
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    selectionColor: '#264f78',
    cursorColor: '#ffffff'
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    selectionColor: '#d7d4f0',
    cursorColor: '#000000'
  }
};

/**
 * Default editor configuration
 */
export const defaultEditorConfig = {
  tabSize: 2,
  indentUnit: 2,
  lineNumbers: true,
  lineWrapping: true,
  foldGutter: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
  matchBrackets: true,
  closeBrackets: true,
  autoCloseTags: true,
  extraKeys: {
    'Ctrl-Space': 'autocomplete',
    'Ctrl-/': 'toggleComment',
    'Cmd-/': 'toggleComment',
  }
};