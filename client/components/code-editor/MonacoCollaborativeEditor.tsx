'use client';

import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { useCodeEditorSettings } from '@/hooks/code-editor/useCodeEditorSettings';
import { useYjsMonaco } from '@/hooks/code-editor/useYjsMonaco';
import { CodeEditorRef } from '@/types/code.types';
import { LANGUAGE_TEMPLATES } from '@/lib/editorConstants';
import { roomPersistence } from '@/lib/roomPersistence';

// Dynamic imports to avoid SSR issues
const MonacoEditorWrapper = dynamic(
  () => import('./MonacoEditorWrapper').then(mod => ({ default: mod.MonacoEditorWrapper })),
  { ssr: false }
);

const EditorToolbar = dynamic(
  () => import('./EditorToolbar').then(mod => ({ default: mod.EditorToolbar })),
  { ssr: false }
);

const EditorStatusBar = dynamic(
  () => import('./EditorStatusBar').then(mod => ({ default: mod.EditorStatusBar })),
  { ssr: false }
);

interface MonacoCollaborativeEditorProps {
  roomId: string;
  initialLanguage?: string;
  initialTheme?: 'vs-dark' | 'vs-light' | 'hc-black';
  socketInstance?: any;
  onLanguageChange?: (language: string) => void;
  className?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  readOnly?: boolean;
  collaborators?: number;
  isConnected?: boolean;
}

export interface MonacoCollaborativeEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  getLanguage: () => string;
  isEmpty: () => boolean;
}

export const MonacoCollaborativeEditor = forwardRef<MonacoCollaborativeEditorRef, MonacoCollaborativeEditorProps>(({
  roomId,
  initialLanguage = 'javascript',
  initialTheme = 'vs-dark',
  socketInstance,
  onLanguageChange,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  readOnly = false,
  collaborators = 0,
  isConnected = true,
}, ref) => {
  const editorRef = useRef<CodeEditorRef>(null);
  const monacoEditorRef = useRef<any>(null);
  const [code, setCode] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lineCount: 0, characterCount: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Editor settings
  const {
    language,
    theme,
    fontSize,
    minimap,
    wordWrap,
    tabSize,
    handleLanguageChange,
    handleThemeChange,
    handleFontSizeChange,
    handleMinimapToggle,
    handleWordWrapToggle,
    handleTabSizeChange,
    supportedLanguages,
    themes,
  } = useCodeEditorSettings();

  // Initialize Yjs collaboration
  const { isConnected: yjsConnected, isReady } = useYjsMonaco({
    roomId,
    monacoEditor: monacoEditorRef.current,
    socketInstance,
    onContentChange: (content: string) => {
      setCode(content);
      
      // Update stats
      const lines = content.split('\n').length;
      const characters = content.length;
      setStats({ lineCount: lines, characterCount: characters });
      
      // Save to localStorage periodically
      if (content.trim()) {
        roomPersistence.saveCodeState(roomId, {
          content,
          language,
          timestamp: Date.now()
        });
      }
    }
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => monacoEditorRef.current?.getValue() || '',
    setContent: (content: string) => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.setValue(content);
      }
    },
    getLanguage: () => language,
    isEmpty: () => !monacoEditorRef.current?.getValue()?.trim()
  }));

  // Restore state once Yjs is ready
  useEffect(() => {
    if (isReady && monacoEditorRef.current) {
      const savedState = roomPersistence.getCodeState(roomId);
      if (savedState && savedState.content && !monacoEditorRef.current.getValue().trim()) {
        console.log('🔄 Restoring code editor state from localStorage');
        setTimeout(() => {
          if (monacoEditorRef.current && !monacoEditorRef.current.getValue().trim()) {
            monacoEditorRef.current.setValue(savedState.content || '');
            if (savedState.language) {
              handleLanguageChange(savedState.language);
            }
          }
        }, 1000);
      }
    }
  }, [isReady, roomId, handleLanguageChange]);

  // Initialize settings
  useEffect(() => {
    setIsLoaded(true);
    handleLanguageChange(initialLanguage);
    handleThemeChange(initialTheme);
  }, [initialLanguage, initialTheme, handleLanguageChange, handleThemeChange]);

  const handleLanguageChangeInternal = useCallback((newLanguage: string) => {
    handleLanguageChange(newLanguage);
    onLanguageChange?.(newLanguage);
    
    // Apply template if editor is empty
    if (monacoEditorRef.current && !monacoEditorRef.current.getValue().trim()) {
      const template = LANGUAGE_TEMPLATES[newLanguage] || '';
      if (template) {
        monacoEditorRef.current.setValue(template);
      }
    }
  }, [handleLanguageChange, onLanguageChange]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    monacoEditorRef.current = editor;
    
    // Set initial content
    const initialContent = LANGUAGE_TEMPLATES[language] || '';
    if (initialContent && !editor.getValue().trim()) {
      editor.setValue(initialContent);
    }

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Listen for model content changes (for stats)
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      const lines = content.split('\n').length;
      const characters = content.length;
      setStats({ lineCount: lines, characterCount: characters });
    });

    console.log('🎯 Monaco editor mounted and configured');
  }, [language]);

  const handleFormatDocument = useCallback(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, []);

  const handleCopyContent = useCallback(() => {
    if (monacoEditorRef.current) {
      const content = monacoEditorRef.current.getValue();
      navigator.clipboard.writeText(content);
    }
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showToolbar && (
        <EditorToolbar
          language={language}
          theme={theme}
          fontSize={fontSize}
          minimap={minimap}
          wordWrap={wordWrap === 'on'}
          onLanguageChange={handleLanguageChangeInternal}
          onThemeChange={handleThemeChange}
          onFontSizeChange={handleFontSizeChange}
          onMinimapToggle={handleMinimapToggle}
          onWordWrapToggle={handleWordWrapToggle}
          onCopy={handleCopyContent}
          supportedLanguages={supportedLanguages}
          themes={themes}
        />
      )}

      <div className="flex-1 relative">
        {isLoaded && (
          <MonacoEditorWrapper
            ref={editorRef}
            value={code}
            language={language}
            theme={theme}
            fontSize={fontSize}
            minimap={minimap}
            wordWrap={wordWrap}
            tabSize={tabSize}
            readOnly={readOnly}
            onMount={handleEditorDidMount}
            height="100%"
            className="w-full h-full"
          />
        )}
      </div>

      {showStatusBar && (
        <EditorStatusBar
          language={language}
          cursorPosition={cursorPosition}
          lineCount={stats.lineCount}
          characterCount={stats.characterCount}
          isConnected={isConnected && yjsConnected}
          collaborators={collaborators}
        />
      )}
    </div>
  );
});

MonacoCollaborativeEditor.displayName = 'MonacoCollaborativeEditor';
