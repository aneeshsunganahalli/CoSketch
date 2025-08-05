export interface CodeEditorProps {
  value?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  onChange?: (value: string) => void;
  onMount?: (editor: any, monaco: any) => void;
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  minimap?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  tabSize?: number;
  insertSpaces?: boolean;
  automaticLayout?: boolean;
}

export interface CodeEditorRef {
  editor: any;
  monaco: any;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  formatDocument: () => void;
  getSelection: () => any;
  setSelection: (selection: any) => void;
}

export interface LanguageOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ThemeOption {
  value: 'vs-dark' | 'vs-light' | 'hc-black';
  label: string;
}
