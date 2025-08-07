'use client'

import Whiteboard from "@/components/WhiteBoard";
import RoomLink from "@/components/room/RoomLink";
import { CodeEditorWrapper } from "@/components/CodeEditorWrapper";
import LeaveRoomModal from "@/components/modals/LeaveRoomModal";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useEffect, useRef } from "react";
import { DrawData, BroadcastMessage, UserJoinedEvent, UserLeftEvent, RoomUsersEvent, CursorMoveEvent } from "@/types/socket.types";
import { roomPersistence } from "@/lib/roomPersistence";

const Room = () => {
  const { id } = useParams();
  const router = useRouter();
  const roomId = id as string;
  const { user, loading } = useAuth();
  
  const [userCount, setUserCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [codeEditorMode, setCodeEditorMode] = useState<'mini' | 'fullscreen' | 'hidden'>('mini');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const whiteboardRef = useRef<any>(null);
  const codeEditorRef = useRef<any>(null);

  // Save state periodically and on tab changes
  useEffect(() => {
    const saveCurrentState = () => {
      // Save whiteboard state if available
      if (whiteboardRef.current?.getCanvasState) {
        try {
          const canvasState = whiteboardRef.current.getCanvasState();
          roomPersistence.saveWhiteboardState(roomId, {
            canvasState: JSON.stringify(canvasState),
            timestamp: Date.now()
          });
        } catch (error) {
          console.warn('Could not save whiteboard state:', error);
        }
      }
    };

    // Save state every 30 seconds
    const interval = setInterval(saveCurrentState, 30000);
    
    // Save state when tab becomes hidden (user navigating away/refreshing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentState();
      }
    };

    // Save state before page unload
    const handleBeforeUnload = () => {
      saveCurrentState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      saveCurrentState(); // Save on component unmount
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId]);

  // Cleanup old localStorage data on mount
  useEffect(() => {
    roomPersistence.cleanup();
  }, []);

  const { 
    isConnected, 
    socketId,
    socketInstance, // Get socket instance
    emitDraw,
    emitBroadcast,
    emitCanvasState,
    emitClearCanvas,
    emitCursorMove 
  } = useSocket({
    roomId,
    userName: user?.name,
    isAuthenticated: !!user,
    authLoading: loading,
    onUserJoined: (data: UserJoinedEvent) => {
      console.log('User joined:', data);
      setUserCount(data.userCount);
      
      // When a new user joins, sync canvas state to them
      if (whiteboardRef.current?.syncCanvas) {
        setTimeout(() => {
          whiteboardRef.current?.syncCanvas();
        }, 500); // Small delay to ensure the new user is ready
      }
    },
    onUserLeft: (data: UserLeftEvent) => {
      console.log('User left:', data);
      setUserCount(data.userCount);
    },
    onRoomUsers: (data: RoomUsersEvent) => {
      console.log('Room users:', data);
      setUserCount(data.userCount);
      
      // On initial room join/rejoin, try to restore local state if no server state exists
      setTimeout(() => {
        const localWhiteboardState = roomPersistence.getWhiteboardState(roomId);
        if (localWhiteboardState && whiteboardRef.current?.loadBoardData) {
          console.log('🔄 Restoring whiteboard state from localStorage');
          // Only restore if we haven't received server state
          if (whiteboardRef.current.isEmpty && whiteboardRef.current.isEmpty()) {
            try {
              const canvasData = JSON.parse(localWhiteboardState.canvasState || '{}');
              whiteboardRef.current.loadFromJSON(canvasData);
            } catch (error) {
              console.warn('Could not restore whiteboard state:', error);
            }
          }
        }
      }, 1000);
    },
    onBroadcast: (data: BroadcastMessage) => {
      console.log('Room received broadcast:', data);
      // Forward broadcast events to whiteboard
      if (whiteboardRef.current?.handleRemoteMessage) {
        whiteboardRef.current.handleRemoteMessage(data);
      }
    },
    onCursorMove: (data: CursorMoveEvent) => {
      console.log('Room received cursor move:', data);
      // Forward cursor move events to whiteboard socket handler
      if (whiteboardRef.current?.handleRemoteCursor) {
        whiteboardRef.current.handleRemoteCursor({
          socket: data.userId,
          userName: data.userName,
          x: data.x,
          y: data.y,
          color: data.color,
          size: data.size,
          tool: data.tool
        });
      }
    },
    onBoardData: (data: { _children: any[] }) => {
      console.log('Room received board data:', data);
      // Load existing board data when joining room
      if (whiteboardRef.current?.loadBoardData) {
        whiteboardRef.current.loadBoardData(data._children);
      }
    },
    onDraw: (data: DrawData) => {
      // This will be handled by the Whiteboard component
      console.log('Received draw data:', data);
    },
    onCanvasState: (state: string) => {
      // This will be handled by the Whiteboard component
      console.log('Received canvas state');
    },
    onClearCanvas: () => {
      // This will be handled by the Whiteboard component
      if (whiteboardRef.current?.handleRemoteClear) {
        whiteboardRef.current.handleRemoteClear();
      }
    }
  });

  // Update connection status when socket connection changes
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <div className="flex items-center text-yellow-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
            Connecting...
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Connected
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            Disconnected
          </div>
        );
      default:
        return null;
    }
  };

  const handleLeaveRoom = () => {
    setIsLeaveModalOpen(false);
    router.push('/');
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-4 lg:px-6 py-3 bg-white border-b border-gray-200 shadow-sm space-y-3 lg:space-y-0">
        {/* Top row on mobile, left section on desktop */}
        <div className="flex items-center justify-between lg:justify-start lg:space-x-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              title="Go to Home"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold text-lg">CoSketch</span>
            </button>
          </div>
          
          {/* Room info and status - moved to left side */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Room:</span>
                <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded border">
                  {roomId}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {userCount} {userCount === 1 ? 'user' : 'users'}
                  </span>
                </div>
                {getConnectionStatus()}
              </div>
            </div>
          </div>
          
          {/* Mobile leave button */}
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="lg:hidden flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            title="Leave Room"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Bottom row on mobile, right section on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Room info for mobile only */}
          <div className="lg:hidden flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">Room:</span>
              <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded border">
                {roomId}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {userCount} {userCount === 1 ? 'user' : 'users'}
                </span>
              </div>
              {getConnectionStatus()}
            </div>
          </div>

          {/* User actions section */}
          <div className="flex items-center justify-between sm:justify-end space-x-3">
            {/* Code Editor Button - positioned to the left of share button */}
            {codeEditorMode === 'hidden' && (
              <button
                onClick={() => setCodeEditorMode('mini')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                title="Show Code Editor"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="hidden sm:inline">Show Editor</span>
              </button>
            )}
            
            <RoomLink roomId={roomId} />
            
            <div className="hidden lg:block h-6 w-px bg-gray-300"></div>
            
            {/* User info */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white text-sm font-semibold select-none">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {user.name}
                    </span>
                    <span className="text-xs text-green-600 font-medium">Authenticated</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-700">Guest User</span>
                    <span className="text-xs text-gray-500 font-medium">Not signed in</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Desktop leave room button */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="hidden lg:flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              title="Leave Room"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3h4a3 3 0 013 3v1" />
              </svg>
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content - Simple Overlay System (No Animations) */}
      <div className="flex h-[calc(100vh-120px)] relative">
        {/* Whiteboard Area */}
        <div className={`${
          codeEditorMode === 'fullscreen' ? 'w-0 overflow-hidden' : 
          codeEditorMode === 'mini' ? 'flex-1' : 'w-full'
        }`}>
          <Whiteboard 
            ref={whiteboardRef}
            roomId={roomId}
            socketService={{
              emitBroadcast,
              emitCursorMove,
              emitClearCanvas
            }}
          />
        </div>

        {/* Code Editor Overlay */}
        {codeEditorMode !== 'hidden' && (
          <div className={`bg-white border-l border-gray-200 ${
            codeEditorMode === 'fullscreen' ? 'w-full' : 'w-[35%]'
          }`}>
            {/* Code Editor Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Code Editor</h3>
              <div className="flex items-center space-x-2">
                {/* Minimize Button */}
                {codeEditorMode === 'fullscreen' && (
                  <button
                    onClick={() => setCodeEditorMode('mini')}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Minimize Editor"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                )}
                
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setCodeEditorMode(codeEditorMode === 'fullscreen' ? 'mini' : 'fullscreen')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={codeEditorMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen Editor'}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {codeEditorMode === 'fullscreen' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9V4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5m0-4.5h4.5m-4.5 0l5.5 5.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setCodeEditorMode('hidden')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Hide Editor"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  </button>
              </div>
            </div>

            {/* Code Editor Content */}
            <div className="h-[calc(100%-48px)]">
              <CodeEditorWrapper 
                ref={codeEditorRef}
                roomId={roomId} 
                isCollaborative={true}
                socketInstance={socketInstance}
              />
            </div>
          </div>
        )}

        {/* Floating Button for Hidden Editor */}
        {codeEditorMode === 'hidden' && (
          <div className="absolute bottom-6 right-6 z-10">
            <button
              onClick={() => setCodeEditorMode('mini')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:scale-105"
              title="Show Code Editor"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Leave Room Modal */}
      <LeaveRoomModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveRoom}
        roomId={roomId}
      />
    </div>
  );
};

export default Room;
