'use client';

import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { EditorView } from '@codemirror/view';
import { CodeMirrorEditor, CodeMirrorRef } from './CodeMirrorEditor';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { useCollaborativeCodeMirror } from '@/hooks/code-editor/useCollaborativeCodeMirror';
import { CODEMIRROR_LANGUAGES, LANGUAGE_TEMPLATES, getFileExtension } from '@/lib/codemirrorLanguages';
import { roomPersistence } from '@/lib/roomPersistence';

interface CollaborativeCodeMirrorProps {
  roomId: string;
  initialLanguage?: string;
  initialValue?: string;
  socketInstance?: any;
  onLanguageChange?: (language: string) => void;
  onChange?: (content: string) => void;
  className?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  readOnly?: boolean;
  collaborators?: number;
  isConnected?: boolean;
}

export interface CollaborativeCodeMirrorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  getLanguage: () => string;
  isEmpty: () => boolean;
  saveState?: () => void;
}

export const CollaborativeCodeMirror = forwardRef<CollaborativeCodeMirrorRef, CollaborativeCodeMirrorProps>(({
  roomId,
  initialLanguage = 'javascript',
  initialValue = '',
  socketInstance,
  onLanguageChange,
  onChange,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  readOnly = false,
  collaborators = 0,
  isConnected = true,
}, ref) => {
  const editorRef = useRef<CodeMirrorRef>(null);
  const [language, setLanguage] = useState(initialLanguage);
  const theme = 'dark'; // Always dark theme
  const [fontSize, setFontSize] = useState(14);
  const [code, setCode] = useState(initialValue || LANGUAGE_TEMPLATES[initialLanguage] || LANGUAGE_TEMPLATES.default || '');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lineCount: 0, characterCount: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  // Initialize collaborative features
  const { ydoc, ytext, isConnected: yjsConnected, userCount, collabExtension, isReady } = useCollaborativeCodeMirror({
    roomId,
    socketInstance
  });

  // Create supported languages array
  const supportedLanguages = Object.entries(CODEMIRROR_LANGUAGES).map(([value, label]) => ({
    value,
    label
  }));

  const themes = [{ value: 'dark', label: 'Dark' }];

  // Save state function
  const saveState = useCallback(() => {
    if (typeof window === 'undefined' || !editorRef.current) return;
    
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
    setContent: (content: string) => editorRef.current?.setValue(content),
    getLanguage: () => language,
    isEmpty: () => !editorRef.current?.getValue()?.trim(),
    saveState
  }));

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Initialize with props
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  // Update code when initialValue changes (for persistence) - improved
  useEffect(() => {
    if (!initialValue || !ytext || initialValue === code) return;
    
    const currentContent = ytext.toString();
    // Only set initial value if Yjs document is empty and we have content to set
    if (!currentContent.trim() && initialValue.trim()) {
      console.log('🔄 Setting initial code from persistence into empty Yjs document');
      setCode(initialValue);
      // Insert into Yjs document immediately since it's empty
      ytext.insert(0, initialValue);
    }
  }, [initialValue, ytext, code]);

  // Restore state on mount - improved timing
  useEffect(() => {
    if (typeof window === 'undefined' || !isReady || !editorRef.current || !ytext) return;
    
    // Wait a bit longer for any remote content to sync first
    const restoreTimer = setTimeout(() => {
      try {
        const currentContent = ytext.toString();
        const savedState = roomPersistence.getCodeState(roomId);
        
        // Only restore from localStorage if:
        // 1. We have saved state
        // 2. Current Yjs document is empty (no remote content)
        // 3. Saved content is not empty
        if (savedState && savedState.content && !currentContent.trim() && savedState.content.trim()) {
          console.log('🔄 Restoring code editor state from localStorage (no remote content found)');
          ytext.insert(0, savedState.content);
          if (savedState.language && savedState.language !== language) {
            setLanguage(savedState.language);
            onLanguageChange?.(savedState.language);
          }
        } else if (currentContent.trim()) {
          console.log('📡 Remote content found, skipping localStorage restoration');
        }
      } catch (error) {
        console.warn('Failed to restore code editor state:', error);
      }
    }, 2000); // Increased delay to wait for remote sync

    return () => clearTimeout(restoreTimer);
  }, [isReady, roomId, ytext, language, onLanguageChange]);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
    console.log(`Language changed to: ${newLanguage}`);
  }, [onLanguageChange]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onChange?.(newCode);
    
    // Update stats
    const lines = newCode.split('\n').length;
    const characters = newCode.length;
    setStats({ lineCount: lines, characterCount: characters });
    
    // Save to localStorage periodically (client-side only)
    if (typeof window !== 'undefined' && newCode.trim()) {
      try {
        roomPersistence.saveCodeState(roomId, {
          content: newCode,
          language,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Failed to auto-save code state:', error);
      }
    }
  }, [roomId, language, onChange]);

  const handleEditorMount = useCallback((view: EditorView) => {
    console.log('📝 CodeMirror editor mounted for collaborative editing');
    
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
    a.download = `code-${roomId}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('💾 Code downloaded');
  }, [code, language, roomId]);

  const handleRun = useCallback(() => {
    console.log('🏃 Run button clicked - code execution not implemented yet');
    // TODO: Implement code execution in a sandboxed environment
  }, []);

  const handleReset = useCallback(() => {
    const template = LANGUAGE_TEMPLATES[language] || LANGUAGE_TEMPLATES.default || '';
    if (ytext && editorRef.current) {
      // Clear Yjs document
      ytext.delete(0, ytext.length);
      ytext.insert(0, template);
      setCode(template);
      console.log('🔄 Code editor reset to template');
    }
  }, [language, ytext]);

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

      {/* Collaboration status indicator */}
      {showStatusBar && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-2 ${statusColor}`}>
              <div className={`w-2 h-2 rounded-full ${yjsConnected && isReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {connectionStatusText}
            </span>
            <span className="text-gray-500">
              Room: {roomId} • Users: {userCount || 0}
            </span>
          </div>
        </div>
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
          extensions={collabExtension.length > 0 ? collabExtension : []}
          className="h-full"
        />
      </div>

      {showStatusBar && (
        <EditorStatusBar
          language={language}
          lineCount={stats.lineCount}
          characterCount={stats.characterCount}
          cursorPosition={cursorPosition}
          isConnected={isConnected && yjsConnected}
          collaborators={userCount || collaborators}
        />
      )}
    </div>
  );
});

CollaborativeCodeMirror.displayName = 'CollaborativeCodeMirror';
