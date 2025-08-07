'use client';

import React, { useState, forwardRef } from 'react';
import { CodeEditor } from './CodeEditor';
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor';

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
        <div className="h-[calc(100vh-8rem)]">
          <CollaborativeCodeEditor
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
          <p><strong>Mode:</strong> Collaborative (Yjs CRDT)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Code Editor Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A full-featured code editor with Monaco Editor, syntax highlighting, and collaborative features.
        </p>
      </div>
      
      <div className="h-[calc(100vh-8rem)]">
        <CodeEditor
          initialLanguage={language}
          onChange={setCode}
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
        <p><strong>Current Language:</strong> {language}</p>
        <p><strong>Code Length:</strong> {code.length} characters</p>
      </div>
    </div>
  );
});

CodeEditorWrapper.displayName = 'CodeEditorWrapper';
