'use client';

import React, { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor';

interface CodeEditorWrapperProps {
  roomId?: string;
  isCollaborative?: boolean;
}

export const CodeEditorWrapper: React.FC<CodeEditorWrapperProps> = ({ 
  roomId, 
  isCollaborative = false 
}) => {
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
          <CollaborativeCodeEditor
            roomId={roomId}
            initialLanguage={language}
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
};
