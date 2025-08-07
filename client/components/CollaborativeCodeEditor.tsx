'use client';

import React, { useState, useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { useCodeEditorSettings } from '../hooks/code-editor/useCodeEditorSettings';
import { useYjsMonaco } from '../hooks/code-editor/useYjsMonaco';
import { CodeEditorRef } from '../types/code.types';
import { LANGUAGE_TEMPLATES } from '../lib/editorConstants';
import { roomPersistence } from '../lib/roomPersistence';
import type { editor } from 'monaco-editor';

// Dynamic import to avoid SSR issues
const MonacoEditorWrapper = dynamic(
  () => import('./code-editor/MonacoEditorWrapper').then(mod => ({ default: mod.MonacoEditorWrapper })),
  { ssr: false }
);

const EditorToolbar = dynamic(
  () => import('./code-editor/EditorToolbar').then(mod => ({ default: mod.EditorToolbar })),
  { ssr: false }
);

const EditorStatusBar = dynamic(
  () => import('./code-editor/EditorStatusBar').then(mod => ({ default: mod.EditorStatusBar })),
  { ssr: false }
);

const MonacoRemoteCursors = dynamic(
  () => import('./code-editor/MonacoRemoteCursors').then(mod => ({ default: mod.MonacoRemoteCursors })),
  { ssr: false }
);

interface CollaborativeCodeEditorProps {
  roomId: string;
  initialLanguage?: string;
  initialTheme?: 'vs-dark' | 'vs-light' | 'hc-black';
  socketInstance?: any; // Accept shared socket instance
  onLanguageChange?: (language: string) => void;
  className?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  readOnly?: boolean;
  collaborators?: number;
  isConnected?: boolean;
}

export const CollaborativeCodeEditor = React.forwardRef<any, CollaborativeCodeEditorProps>(({
  roomId,
  initialLanguage = 'javascript',
  initialTheme = 'vs-dark',
  socketInstance, // Receive shared socket instance
  onLanguageChange,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  readOnly = false,
  collaborators = 0,
  isConnected = true,
}, ref) => {
  const editorRef = useRef<CodeEditorRef>(null);
  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lineCount: 0, characterCount: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  // Track if we've tried to restore state
  const [hasRestoredState, setHasRestoredState] = useState(false);

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
  const { isConnected: yjsConnected, isReady, awareness } = useYjsMonaco({
    roomId,
    monacoEditor: monacoEditorRef.current,
    socketInstance, // Pass shared socket instance
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

  // Restore state on mount
  useEffect(() => {
    if (isReady && monacoEditorRef.current) {
      // Try to restore from localStorage if editor is empty
      const savedState = roomPersistence.getCodeState(roomId);
      if (savedState && savedState.content && !monacoEditorRef.current.getValue().trim()) {
        console.log('🔄 Restoring code editor state from localStorage');
        // Small delay to ensure Yjs is ready
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
  }, [isReady, roomId]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Initialize with props
  useEffect(() => {
    handleLanguageChange(initialLanguage);
  }, [initialLanguage, handleLanguageChange]);

  useEffect(() => {
    handleThemeChange(initialTheme);
  }, [initialTheme, handleThemeChange]);

  const handleLanguageChangeInternal = useCallback((newLanguage: string) => {
    handleLanguageChange(newLanguage);
    onLanguageChange?.(newLanguage);
    
    // For collaborative editing, we don't automatically change the content
    // as that would override what others might have typed
    console.log(`Language changed to: ${newLanguage}`);
  }, [handleLanguageChange, onLanguageChange]);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: any) => {
    monacoEditorRef.current = editor;
    
    // Listen to cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Initial stats
    const value = editor.getValue();
    const lines = value.split('\n').length;
    const characters = value.length;
    setStats({ lineCount: lines, characterCount: characters });
    
    console.log('📝 Monaco editor mounted for collaborative editing');
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      console.log('📋 Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-${roomId}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('💾 Code downloaded');
  }, [code, language, roomId]);

  const handleReset = useCallback(() => {
    if (!monacoEditorRef.current) return;
    
    const template = LANGUAGE_TEMPLATES[language] || '';
    monacoEditorRef.current.setValue(template);
    console.log('🔄 Editor reset to template');
  }, [language]);

  const handleRun = useCallback(() => {
    // This is a placeholder - you can implement code execution logic here
    console.log('▶️ Running code:', code);
    // You could send the code to a backend service for execution
  }, [code]);

  const connectionStatusText = yjsConnected && isReady ? 'Connected' : 'Connecting...';
  const statusColor = yjsConnected && isReady ? 'text-green-600' : 'text-yellow-600';

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Loading collaborative editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {showToolbar && (
        <EditorToolbar
          language={language}
          theme={theme}
          fontSize={fontSize}
          minimap={minimap}
          wordWrap={wordWrap === 'on'}
          supportedLanguages={supportedLanguages}
          themes={themes}
          onLanguageChange={handleLanguageChangeInternal}
          onThemeChange={handleThemeChange}
          onFontSizeChange={handleFontSizeChange}
          onMinimapToggle={handleMinimapToggle}
          onWordWrapToggle={handleWordWrapToggle}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onRun={handleRun}
          onReset={handleReset}
        />
      )}

      {/* Collaboration status indicator */}
      {showStatusBar && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-2 ${statusColor}`}>
              <div className={`w-2 h-2 rounded-full ${yjsConnected && isReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {connectionStatusText}
            </span>
            <span className="text-gray-500">
              Room: {roomId}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <MonacoEditorWrapper
          ref={editorRef}
          value={code}
          language={language}
          theme={theme}
          onChange={() => {}} // Yjs handles changes
          onMount={handleEditorMount}
          readOnly={readOnly}
          minimap={minimap}
          wordWrap={wordWrap}
          fontSize={fontSize}
          tabSize={tabSize}
          height="100%"
          width="100%"
        />
        
        {/* Remote cursors overlay */}
        {awareness && monacoEditorRef.current && (
          <MonacoRemoteCursors
            awareness={awareness}
            monacoEditor={monacoEditorRef.current}
            className="pointer-events-none"
          />
        )}
      </div>

      {showStatusBar && (
        <EditorStatusBar
          language={language}
          lineCount={stats.lineCount}
          characterCount={stats.characterCount}
          cursorPosition={cursorPosition}
          isConnected={isConnected && yjsConnected}
          collaborators={collaborators}
        />
      )}
    </div>
  );
});

CollaborativeCodeEditor.displayName = 'CollaborativeCodeEditor';

// Helper function to get file extension based on language
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    yaml: 'yml',
    markdown: 'md',
    sql: 'sql',
    shell: 'sh',
    dockerfile: 'dockerfile',
    plaintext: 'txt',
  };
  
  return extensions[language] || 'txt';
}

export default CollaborativeCodeEditor;
