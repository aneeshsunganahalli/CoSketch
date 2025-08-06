// Types for CodeMirror-based editor components
export interface CodeEditorProps {
  value?: string;
  language?: string;
  theme?: 'light' | 'dark';
  onChange?: (value: string) => void;
  onMount?: (view: any) => void; // CodeMirror EditorView
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  fontSize?: number;
  placeholder?: string;
  extensions?: any[]; // CodeMirror Extensions
}

export interface CodeEditorRef {
  view: any; // CodeMirror EditorView
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  getSelection: () => string;
}

export interface LanguageOption {
  value: string;
  label: string;
  icon?: string;
  extension?: () => any; // CodeMirror Extension
}

export interface ThemeOption {
  value: 'light' | 'dark';
  label: string;
}
