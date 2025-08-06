'use client';

import React, { useState, forwardRef } from 'react';
import { SimpleCodeMirror } from './code-editor/SimpleCodeMirror';
import { CollaborativeCodeMirror } from './code-editor/CollaborativeCodeMirror';

interface CodeEditorWrapperProps {
  roomId?: string;
  isCollaborative?: boolean;
  socketInstance?: any; // Accept shared socket instance
}

export const CodeEditorWrapper = forwardRef<any, CodeEditorWrapperProps>(({ 
  roomId, 
  isCollaborative = false,
  socketInstance // Receive shared socket instance
}, ref) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

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
            ref={ref}
            roomId={roomId}
            initialLanguage={language}
            socketInstance={socketInstance} // Pass shared socket instance
            onLanguageChange={setLanguage}
            showToolbar={true}
            showStatusBar={true}
            collaborators={2}
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
          initialLanguage={language}
          onChange={setCode}
          onLanguageChange={setLanguage}
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
