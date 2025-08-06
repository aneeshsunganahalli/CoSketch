'use client';

import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorView } from '@codemirror/view';
import { CodeMirrorEditor, CodeMirrorRef } from './CodeMirrorEditor';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { CODEMIRROR_LANGUAGES, LANGUAGE_TEMPLATES, getFileExtension } from '@/lib/codemirrorLanguages';
import { roomPersistence } from '@/lib/roomPersistence';

interface SimpleCodeMirrorProps {
  initialValue?: string;
  initialLanguage?: string;
  onChange?: (value: string) => void;
  onLanguageChange?: (language: string) => void;
  className?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  readOnly?: boolean;
  collaborators?: number;
  isConnected?: boolean;
  roomId?: string; // Added for persistence
}

export interface SimpleCodeMirrorRef {
  getContent: () => string;
  getLanguage: () => string;
  saveState?: () => void;
}

export const SimpleCodeMirror = forwardRef<SimpleCodeMirrorRef, SimpleCodeMirrorProps>(({
  initialValue = '',
  initialLanguage = 'javascript',
  onChange,
  onLanguageChange,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  readOnly = false,
  collaborators = 0,
  isConnected = true,
  roomId,
}, ref) => {
  const editorRef = useRef<CodeMirrorRef>(null);
  const [language, setLanguage] = useState(initialLanguage);
  const theme = 'dark'; // Always dark theme
  const [fontSize, setFontSize] = useState(14);
  const [code, setCode] = useState(initialValue || LANGUAGE_TEMPLATES[initialLanguage] || LANGUAGE_TEMPLATES.default || '');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lineCount: 0, characterCount: 0 });
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  // Create supported languages array
  const supportedLanguages = Object.entries(CODEMIRROR_LANGUAGES).map(([value, label]) => ({
    value,
    label
  }));

  const themes = [{ value: 'dark', label: 'Dark' }];

  // Save state function
  const saveState = useCallback(() => {
    if (typeof window === 'undefined' || !roomId || !editorRef.current) return;
    
    try {
      const content = editorRef.current.getValue();
      if (content?.trim()) {
        roomPersistence.saveCodeState(roomId, {
          content,
          language,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('Failed to save code state:', error);
    }
  }, [roomId, language]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.getValue() || '',
    getLanguage: () => language,
    saveState
  }));

  // Initialize with props
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
    
    // Set template if code is empty or user wants to reset
    if (!code.trim()) {
      const template = LANGUAGE_TEMPLATES[newLanguage] || '';
      setCode(template);
      onChange?.(template);
    }
  }, [code, onLanguageChange, onChange]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onChange?.(newCode);
    
    // Update stats
    const lines = newCode.split('\n').length;
    const characters = newCode.length;
    setStats({ lineCount: lines, characterCount: characters });
  }, [onChange]);

  const handleEditorMount = useCallback((view: EditorView) => {
    console.log('📝 CodeMirror editor mounted');
    
    // Initial stats
    const value = view.state.doc.toString();
    const lines = value.split('\n').length;
    const characters = value.length;
    setStats({ lineCount: lines, characterCount: characters });
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
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('💾 Code downloaded');
  }, [code, language]);

  const handleReset = useCallback(() => {
    const template = LANGUAGE_TEMPLATES[language] || '';
    setCode(template);
    onChange?.(template);
    editorRef.current?.setValue(template);
    console.log('🔄 Editor reset to template');
  }, [language, onChange]);

  const handleRun = useCallback(() => {
    console.log('▶️ Running code:', code);
    // Placeholder for code execution
  }, [code]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {showToolbar && (
        <EditorToolbar
          language={language}
          theme={theme}
          fontSize={fontSize}
          minimap={minimap}
          wordWrap={true} // Always enabled in our CodeMirror setup
          supportedLanguages={supportedLanguages}
          themes={themes}
          onLanguageChange={handleLanguageChange}
          onThemeChange={() => {}} // No-op since we only support dark theme
          onFontSizeChange={setFontSize}
          onMinimapToggle={() => setMinimap(!minimap)}
          onWordWrapToggle={() => {}} // No-op for CodeMirror
          onCopy={handleCopy}
          onDownload={handleDownload}
          onRun={handleRun}
          onReset={handleReset}
        />
      )}

      <div className="flex-1 min-h-0">
        <CodeMirrorEditor
          ref={editorRef}
          value={code}
          language={language}
          theme={theme}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          readOnly={readOnly}
          fontSize={fontSize}
          className="h-full"
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
});

SimpleCodeMirror.displayName = 'SimpleCodeMirror';
