'use client'

import Whiteboard from "@/components/WhiteBoard";
import RoomLink from "@/components/room/RoomLink";
import { CodeEditorWrapper } from "@/components/CodeEditorWrapper";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useEffect, useRef } from "react";
import { DrawData, BroadcastMessage, UserJoinedEvent, UserLeftEvent, RoomUsersEvent, CursorMoveEvent } from "@/types/socket.types";

const Room = () => {
  const { id } = useParams();
  const router = useRouter();
  const roomId = id as string;
  const { user, loading } = useAuth();
  
  const [userCount, setUserCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'code'>('whiteboard');
  const whiteboardRef = useRef<any>(null);

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
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this room?')) {
                router.push('/');
              }
            }}
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
              onClick={() => {
                if (window.confirm('Are you sure you want to leave this room?')) {
                  router.push('/');
                }
              }}
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'whiteboard'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Whiteboard</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code Editor</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Whiteboard - Always mounted, visibility controlled by CSS */}
        <div className={activeTab === 'whiteboard' ? 'block' : 'hidden'}>
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
        
        {/* Code Editor - Always mounted, visibility controlled by CSS */}
        <div className={`h-full ${activeTab === 'code' ? 'block' : 'hidden'}`}>
          <CodeEditorWrapper 
            roomId={roomId} 
            isCollaborative={true}
            socketInstance={socketInstance} // Pass shared socket instance
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
