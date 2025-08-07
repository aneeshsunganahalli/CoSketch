'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface RemoteUser {
  clientId: number;
  user: {
    name: string;
    color: string;
    colorLight: string;
  };
  cursor?: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface MonacoRemoteCursorsProps {
  awareness: any;
  monacoEditor: any;
  className?: string;
}

export const MonacoRemoteCursors: React.FC<MonacoRemoteCursorsProps> = ({
  awareness,
  monacoEditor,
  className = ''
}) => {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    if (!awareness || !monacoEditor) return;

    const updateRemoteUsers = () => {
      const users: RemoteUser[] = [];
      
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (clientId !== awareness.clientID && state.user) {
          users.push({
            clientId,
            user: state.user,
            cursor: state.cursor,
            selection: state.selection
          });
        }
      });
      
      setRemoteUsers(users);
    };

    // Listen for awareness changes
    awareness.on('update', updateRemoteUsers);
    
    // Listen for cursor changes in Monaco
    const disposable = monacoEditor.onDidChangeCursorPosition((e: any) => {
      awareness.setLocalStateField('cursor', {
        lineNumber: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Listen for selection changes
    const selectionDisposable = monacoEditor.onDidChangeCursorSelection((e: any) => {
      awareness.setLocalStateField('selection', {
        startLineNumber: e.selection.startLineNumber,
        startColumn: e.selection.startColumn,
        endLineNumber: e.selection.endLineNumber,
        endColumn: e.selection.endColumn
      });
    });

    // Initial update
    updateRemoteUsers();

    return () => {
      awareness.off('update', updateRemoteUsers);
      disposable?.dispose();
      selectionDisposable?.dispose();
    };
  }, [awareness, monacoEditor]);

  if (!remoteUsers.length) return null;

  return (
    <div className={`absolute top-2 right-2 flex flex-col space-y-1 z-10 ${className}`}>
      {remoteUsers.map((user) => (
        <div
          key={user.clientId}
          className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-xs border"
          style={{ borderColor: user.user.color }}
        >
          <div
            className="w-3 h-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: user.user.color }}
          >
            <User className="w-2 h-2 text-white" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {user.user.name}
          </span>
          {user.cursor && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {user.cursor.lineNumber}:{user.cursor.column}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
