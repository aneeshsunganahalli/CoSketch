'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import { CodeEditorProps, CodeEditorRef } from '../../types/code.types';
import { DEFAULT_EDITOR_OPTIONS } from '../../lib/editorConstants';
import { useCodeEditor } from '../../hooks/code-editor/useCodeEditor';

export const MonacoEditorWrapper = forwardRef<CodeEditorRef, CodeEditorProps>(
  (
    {
      value = '',
      language = 'javascript',
      theme = 'vs-dark',
      onChange,
      onMount,
      readOnly = false,
      height = '100%',
      width = '100%',
      className = '',
      minimap = true,
      wordWrap = 'on',
      fontSize = 14,
      tabSize = 2,
      insertSpaces = true,
      automaticLayout = true,
      ...props
    },
    ref
  ) => {
    const {
      editorRef,
      handleEditorDidMount,
      getValue,
      setValue,
      focus,
      formatDocument,
      getSelection,
      setSelection,
    } = useCodeEditor();

    useImperativeHandle(ref, () => ({
      editor: editorRef?.editor,
      monaco: editorRef?.monaco,
      getValue,
      setValue,
      focus,
      formatDocument,
      getSelection,
      setSelection,
    }));

    const handleMount = (editor: any, monaco: any) => {
      handleEditorDidMount(editor, monaco);
      onMount?.(editor, monaco);
    };

    const handleChange = (value: string | undefined) => {
      if (value !== undefined && onChange) {
        onChange(value);
      }
    };

    const editorOptions = {
      ...DEFAULT_EDITOR_OPTIONS,
      minimap: { enabled: minimap },
      fontSize,
      tabSize,
      insertSpaces,
      wordWrap,
      automaticLayout,
      readOnly,
    };

    return (
      <div className={`w-full h-full ${className}`}>
        <Editor
          height={height}
          width={width}
          language={language}
          value={value}
          theme={theme}
          onChange={handleChange}
          onMount={handleMount}
          options={editorOptions}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
          {...props}
        />
      </div>
    );
  }
);

MonacoEditorWrapper.displayName = 'MonacoEditorWrapper';
