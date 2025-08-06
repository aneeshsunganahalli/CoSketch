'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { EditorView, placeholder as placeholderExtension } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { getFileExtension } from '@/lib/codemirrorLanguages';
import { customBasicSetup, combineExtensions, getLanguageExtension } from '@/lib/codemirrorSetup';

export interface CodeMirrorRef {
  view: EditorView | null;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  getSelection: () => string;
}

interface CodeMirrorEditorProps {
  value?: string;
  language?: string;
  theme?: 'light' | 'dark';
  onChange?: (value: string) => void;
  onMount?: (view: EditorView) => void;
  readOnly?: boolean;
  fontSize?: number;
  className?: string;
  placeholder?: string;
  extensions?: Extension[];
}

export const CodeMirrorEditor = forwardRef<CodeMirrorRef, CodeMirrorEditorProps>(({
  value = '',
  language = 'javascript',
  theme = 'dark',
  onChange,
  onMount,
  readOnly = false,
  fontSize = 14,
  className = '',
  placeholder = '',
  extensions = []
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    view: viewRef.current,
    getValue: () => viewRef.current?.state.doc.toString() || '',
    setValue: (newValue: string) => {
      if (viewRef.current) {
        const transaction = viewRef.current.state.update({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: newValue
          }
        });
        viewRef.current.dispatch(transaction);
      }
    },
    focus: () => viewRef.current?.focus(),
    getSelection: () => {
      if (viewRef.current) {
        const selection = viewRef.current.state.selection.main;
        return viewRef.current.state.doc.sliceString(selection.from, selection.to);
      }
      return '';
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const themeExtension = theme === 'dark' ? [oneDark] : [];
    const languageExtension = getLanguageExtension(language);
    
    const customTheme = EditorView.theme({
      '&': {
        fontSize: `${fontSize}px`,
      },
      '.cm-content': {
        fontFamily: 'Consolas, "Courier New", monospace',
        lineHeight: '1.5',
        caretColor: theme === 'dark' ? '#ffffff' : '#000000'
      },
      '.cm-editor': {
        borderRadius: '6px',
      },
      '.cm-scroller': {
        fontFamily: 'inherit',
      },
      '.cm-focused': {
        outline: 'none',
      }
    });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        const newValue = update.state.doc.toString();
        onChange(newValue);
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: combineExtensions(
        customBasicSetup,
        languageExtension,
        themeExtension,
        customTheme,
        updateListener,
        EditorView.lineWrapping,
        EditorState.readOnly.of(readOnly),
        EditorView.contentAttributes.of({ 'aria-label': 'Code editor' }),
        placeholder ? placeholderExtension(placeholder) : [],
        extensions
      )
    });

    const view = new EditorView({
      state,
      parent: containerRef.current
    });

    viewRef.current = view;
    onMount?.(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, theme, fontSize, readOnly, placeholder, onMount]);

  // Handle value changes from props
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value
        }
      });
      viewRef.current.dispatch(transaction);
    }
  }, [value]);

  return (
    <div 
      ref={containerRef} 
      className={`codemirror-container h-full w-full ${className}`}
      style={{ height: '100%' }}
    />
  );
});

CodeMirrorEditor.displayName = 'CodeMirrorEditor';
