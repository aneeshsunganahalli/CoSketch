'use client';

import React, { useState, forwardRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { SimpleCodeMirror } from './code-editor/SimpleCodeMirror';
import { CollaborativeCodeMirror } from './code-editor/CollaborativeCodeMirror';
import { roomPersistence } from '@/lib/roomPersistence';

interface CodeEditorWrapperProps {
  roomId?: string;
  isCollaborative?: boolean;
  socketInstance?: any; // Accept shared socket instance
  userCount?: number; // Accept user count
}

export interface CodeEditorWrapperRef {
  getContent: () => string;
  getLanguage: () => string;
  saveState: () => void;
}

export const CodeEditorWrapper = forwardRef<CodeEditorWrapperRef, CodeEditorWrapperProps>(({ 
  roomId, 
  isCollaborative = false,
  socketInstance, // Receive shared socket instance
  userCount = 0 // Receive user count with default
}, ref) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const collaborativeRef = React.useRef<any>(null);
  const simpleRef = React.useRef<any>(null);

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return;
    
    try {
      const savedState = roomPersistence.getCodeState(roomId);
      if (savedState) {
        console.log('🔄 Loading persisted code state from localStorage');
        if (savedState.content) {
          setCode(savedState.content);
        }
        if (savedState.language) {
          setLanguage(savedState.language);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted code state:', error);
    }
  }, [roomId]);

  // Save state periodically and on changes
  const saveCurrentState = useCallback(() => {
    if (typeof window === 'undefined' || !roomId) return;
    
    try {
      const currentRef = isCollaborative ? collaborativeRef.current : simpleRef.current;
      if (currentRef?.getContent) {
        const content = currentRef.getContent();
        const currentLanguage = currentRef.getLanguage ? currentRef.getLanguage() : language;
        
        if (content?.trim()) {
          roomPersistence.saveCodeState(roomId, {
            content,
            language: currentLanguage,
            timestamp: Date.now()
          });
          console.log('💾 Auto-saved code state to localStorage');
        }
      }
    } catch (error) {
      console.warn('Failed to save code state:', error);
    }
  }, [roomId, isCollaborative, language]);

  // Auto-save every 10 seconds and on visibility change
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(saveCurrentState, 10000);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentState();
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveCurrentState(); // Save on cleanup
    };
  }, [roomId, saveCurrentState]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => {
      const currentRef = isCollaborative ? collaborativeRef.current : simpleRef.current;
      return currentRef?.getContent() || '';
    },
    getLanguage: () => {
      const currentRef = isCollaborative ? collaborativeRef.current : simpleRef.current;
      return currentRef?.getLanguage ? currentRef.getLanguage() : language;
    },
    saveState: saveCurrentState
  }));

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Save on significant changes (every 100 characters or so)
    if (newCode.length % 100 === 0) {
      setTimeout(saveCurrentState, 1000); // Debounced save
    }
  }, [saveCurrentState]);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    // Save immediately when language changes
    setTimeout(saveCurrentState, 500);
  }, [saveCurrentState]);

  // Use collaborative editor if roomId is provided
  if (isCollaborative && roomId) {
    return (
      <div className="w-full h-screen p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Collaborative Code Editor</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time collaborative code editing with Yjs CRDT. Changes are synchronized across all users in the room.
          </p>
        </div>
        
        <div className="h-[calc(100vh-8rem)]">
          <CollaborativeCodeMirror
            ref={collaborativeRef}
            roomId={roomId}
            initialLanguage={language}
            initialValue={code}
            socketInstance={socketInstance} // Pass shared socket instance
            onLanguageChange={handleLanguageChange}
            onChange={handleCodeChange}
            showToolbar={true}
            showStatusBar={true}
            collaborators={userCount} // Use actual user count
            isConnected={true}
            className="shadow-lg"
          />
        </div>
        
        {/* Debug info */}
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <p><strong>Room ID:</strong> {roomId}</p>
          <p><strong>Current Language:</strong> {language}</p>
          <p><strong>Mode:</strong> Collaborative (CodeMirror 6 + Yjs CRDT)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Code Editor Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A full-featured code editor with CodeMirror 6, syntax highlighting, and modern features.
        </p>
      </div>
      
      <div className="h-[calc(100vh-8rem)]">
        <SimpleCodeMirror
          ref={simpleRef}
          initialValue={code}
          initialLanguage={language}
          onChange={handleCodeChange}
          onLanguageChange={handleLanguageChange}
          roomId={roomId}
          showToolbar={true}
          showStatusBar={true}
          collaborators={0}
          isConnected={true}
          className="shadow-lg"
        />
      </div>
      
      {/* Debug info */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <p><strong>Current Language:</strong> {language}</p>
        <p><strong>Code Length:</strong> {code.length} characters</p>
        <p><strong>Editor:</strong> CodeMirror 6</p>
      </div>
    </div>
  );
});

CodeEditorWrapper.displayName = 'CodeEditorWrapper';
