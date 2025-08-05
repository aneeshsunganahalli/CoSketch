'use client';

import React, { createContext, useContext, useRef, useState } from 'react';

interface RoomState {
  whiteboardState: any;
  codeEditorState: any;
  activeTab: 'whiteboard' | 'code';
}

interface RoomContextType {
  roomState: RoomState;
  setWhiteboardState: (state: any) => void;
  setCodeEditorState: (state: any) => void;
  setActiveTab: (tab: 'whiteboard' | 'code') => void;
  preserveCurrentState: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: React.ReactNode;
  roomId: string;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children, roomId }) => {
  const [roomState, setRoomState] = useState<RoomState>({
    whiteboardState: null,
    codeEditorState: null,
    activeTab: 'whiteboard'
  });

  const whiteboardRef = useRef<any>(null);
  const codeEditorRef = useRef<any>(null);

  const setWhiteboardState = (state: any) => {
    setRoomState(prev => ({
      ...prev,
      whiteboardState: state
    }));
  };

  const setCodeEditorState = (state: any) => {
    setRoomState(prev => ({
      ...prev,
      codeEditorState: state
    }));
  };

  const setActiveTab = (tab: 'whiteboard' | 'code') => {
    // Preserve current state before switching
    preserveCurrentState();
    
    setRoomState(prev => ({
      ...prev,
      activeTab: tab
    }));
  };

  const preserveCurrentState = () => {
    // This will be called before switching tabs to preserve current state
    if (roomState.activeTab === 'whiteboard' && whiteboardRef.current) {
      // Preserve whiteboard state
      if (whiteboardRef.current.getCanvasState) {
        const currentState = whiteboardRef.current.getCanvasState();
        setWhiteboardState(currentState);
      }
    } else if (roomState.activeTab === 'code' && codeEditorRef.current) {
      // Preserve code editor state
      if (codeEditorRef.current.getContent) {
        const currentContent = codeEditorRef.current.getContent();
        setCodeEditorState(currentContent);
      }
    }
  };

  const value: RoomContextType = {
    roomState,
    setWhiteboardState,
    setCodeEditorState,
    setActiveTab,
    preserveCurrentState
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};
