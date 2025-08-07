'use client';

import React, { useEffect, useState } from 'react';

interface RemoteCursor {
  id: string;
  user: {
    name: string;
    color: string;
  };
  anchor: number;
  head: number;
}

interface RemoteCursorsProps {
  awareness: any;
  className?: string;
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ 
  awareness, 
  className = '' 
}) => {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateCursors = () => {
      const remoteCursors: RemoteCursor[] = [];
      
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (clientId !== awareness.clientID && state.user) {
          const selection = state.selection;
          if (selection) {
            remoteCursors.push({
              id: clientId.toString(),
              user: {
                name: state.user.name || `User ${clientId}`,
                color: state.user.color || '#3b82f6'
              },
              anchor: selection.anchor,
              head: selection.head
            });
          }
        }
      });
      
      setCursors(remoteCursors);
    };

    // Listen for awareness changes
    awareness.on('change', updateCursors);
    
    // Initial update
    updateCursors();

    return () => {
      awareness.off('change', updateCursors);
    };
  }, [awareness]);

  if (!awareness || cursors.length === 0) {
    return null;
  }

  return (
    <div className={`absolute top-2 right-2 flex flex-col space-y-1 z-10 ${className}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Active Users:
      </div>
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          className="flex items-center space-x-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cursor.user.color }}
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-20">
            {cursor.user.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RemoteCursors;
