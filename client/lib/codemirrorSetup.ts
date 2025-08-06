import { Extension } from '@codemirror/state';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

// Custom basic setup to avoid conflicts
export const customBasicSetup: Extension[] = [
  lineNumbers(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap
  ])
];

// Safe extension combiner that filters out invalid extensions
export function combineExtensions(...extensions: (Extension | Extension[] | null | undefined)[]): Extension[] {
  const result: Extension[] = [];
  
  for (const ext of extensions) {
    if (ext == null) continue;
    
    if (Array.isArray(ext)) {
      result.push(...ext.filter(e => e != null));
    } else {
      result.push(ext);
    }
  }
  
  return result;
}
