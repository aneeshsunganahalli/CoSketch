import { useRef, useCallback } from 'react';
import { CodeEditorRef } from '../../types/code.types';

export const useCodeEditor = () => {
  const editorRef = useRef<CodeEditorRef | null>(null);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = {
      editor,
      monaco,
      getValue: () => editor.getValue(),
      setValue: (value: string) => editor.setValue(value),
      focus: () => editor.focus(),
      formatDocument: () => {
        editor.getAction('editor.action.formatDocument')?.run();
      },
      getSelection: () => editor.getSelection(),
      setSelection: (selection: any) => editor.setSelection(selection),
    };
  }, []);

  const getValue = useCallback(() => {
    return editorRef.current?.getValue() || '';
  }, []);

  const setValue = useCallback((value: string) => {
    editorRef.current?.setValue(value);
  }, []);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const formatDocument = useCallback(() => {
    editorRef.current?.formatDocument();
  }, []);

  const getSelection = useCallback(() => {
    return editorRef.current?.getSelection();
  }, []);

  const setSelection = useCallback((selection: any) => {
    editorRef.current?.setSelection(selection);
  }, []);

  return {
    editorRef: editorRef.current,
    handleEditorDidMount,
    getValue,
    setValue,
    focus,
    formatDocument,
    getSelection,
    setSelection,
  };
};
