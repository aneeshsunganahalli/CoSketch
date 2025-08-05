'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MonacoEditorWrapper } from './code-editor/MonacoEditorWrapper';
import { EditorToolbar } from './code-editor/EditorToolbar';
import { EditorStatusBar } from './code-editor/EditorStatusBar';
import { useCodeEditorSettings } from '../hooks/code-editor/useCodeEditorSettings';
import { CodeEditorRef } from '../types/code.types';
import { LANGUAGE_TEMPLATES } from '../lib/editorConstants';

interface CodeEditorProps {
  initialValue?: string;
  initialLanguage?: string;
  initialTheme?: 'vs-dark' | 'vs-light' | 'hc-black';
  onChange?: (value: string) => void;
  onLanguageChange?: (language: string) => void;
  className?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  readOnly?: boolean;
  collaborators?: number;
  isConnected?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialValue = '',
  initialLanguage = 'javascript',
  initialTheme = 'vs-dark',
  onChange,
  onLanguageChange,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  readOnly = false,
  collaborators = 0,
  isConnected = true,
}) => {
  const editorRef = useRef<CodeEditorRef>(null);
  const [code, setCode] = useState(initialValue || LANGUAGE_TEMPLATES[initialLanguage] || '');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lineCount: 0, characterCount: 0 });

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

  // Initialize with props
  useEffect(() => {
    handleLanguageChange(initialLanguage);
  }, [initialLanguage, handleLanguageChange]);

  useEffect(() => {
    handleThemeChange(initialTheme);
  }, [initialTheme, handleThemeChange]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    onChange?.(value);
    
    // Update stats
    const lines = value.split('\n').length;
    const characters = value.length;
    setStats({ lineCount: lines, characterCount: characters });
  }, [onChange]);

  const handleLanguageChangeInternal = useCallback((newLanguage: string) => {
    handleLanguageChange(newLanguage);
    onLanguageChange?.(newLanguage);
    
    // Set template if code is empty or user wants to reset
    if (!code.trim()) {
      const template = LANGUAGE_TEMPLATES[newLanguage] || '';
      setCode(template);
      onChange?.(template);
    }
  }, [code, handleLanguageChange, onLanguageChange, onChange]);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
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
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, language]);

  const handleReset = useCallback(() => {
    const template = LANGUAGE_TEMPLATES[language] || '';
    setCode(template);
    onChange?.(template);
    editorRef.current?.setValue(template);
  }, [language, onChange]);

  const handleRun = useCallback(() => {
    // This is a placeholder - you can implement code execution logic here
    console.log('Running code:', code);
    // You could send the code to a backend service for execution
  }, [code]);

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

      <div className="flex-1 min-h-0">
        <MonacoEditorWrapper
          ref={editorRef}
          value={code}
          language={language}
          theme={theme}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          readOnly={readOnly}
          minimap={minimap}
          wordWrap={wordWrap}
          fontSize={fontSize}
          tabSize={tabSize}
          height="100%"
          width="100%"
        />
      </div>

      {showStatusBar && (
        <EditorStatusBar
          language={language}
          lineCount={stats.lineCount}
          characterCount={stats.characterCount}
          cursorPosition={cursorPosition}
          isConnected={isConnected}
          collaborators={collaborators}
        />
      )}
    </div>
  );
};

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

export default CodeEditor;