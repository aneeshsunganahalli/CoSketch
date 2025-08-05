'use client';

import React from 'react';
import { FileText, Users, Wifi, WifiOff } from 'lucide-react';

interface EditorStatusBarProps {
  language: string;
  lineCount?: number;
  characterCount?: number;
  cursorPosition?: { line: number; column: number };
  isConnected?: boolean;
  collaborators?: number;
  className?: string;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  language,
  lineCount = 0,
  characterCount = 0,
  cursorPosition,
  isConnected = true,
  collaborators = 0,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {/* Left side - File info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <FileText className="w-3 h-3" />
          <span className="capitalize">{language}</span>
        </div>
        
        {cursorPosition && (
          <div>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </div>
        )}
        
        <div>
          {lineCount} lines
        </div>
        
        <div>
          {characterCount} characters
        </div>
      </div>

      {/* Right side - Connection and collaboration info */}
      <div className="flex items-center space-x-4">
        {collaborators > 0 && (
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{collaborators} collaborator{collaborators !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-500" />
              <span className="text-red-500">Disconnected</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
