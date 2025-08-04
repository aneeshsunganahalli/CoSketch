'use client'

import Whiteboard from "@/components/WhiteBoard";
import RoomLink from "@/components/room/RoomLink";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useEffect, useRef } from "react";
import { DrawData, BroadcastMessage, UserJoinedEvent, UserLeftEvent, RoomUsersEvent, CursorMoveEvent } from "@/types/socket.types";

const Room = () => {
  const { id } = useParams();
  const roomId = id as string;
  const { user } = useAuth();
  
  const [userCount, setUserCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const whiteboardRef = useRef<any>(null);

  const { 
    isConnected, 
    socketId,
    emitDraw,
    emitBroadcast,
    emitCanvasState,
    emitClearCanvas,
    emitCursorMove 
  } = useSocket({
    roomId,
    userName: user?.name,
    isAuthenticated: !!user,
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

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-500 shadow-emerald-500/25 shadow-lg';
      case 'connecting': return 'bg-amber-500 shadow-amber-500/25 shadow-lg';
      case 'disconnected': return 'bg-red-500 shadow-red-500/25 shadow-lg';
      default: return 'bg-gray-400 shadow-gray-400/25 shadow-lg';
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-white">
      {/* Enhanced Room header */}
      <div className="absolute top-4 left-4 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Room</span>
              <span className="text-sm font-semibold text-gray-800 font-mono">{roomId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Connection status and user count */}
      <div className="absolute top-4 right-4 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:bg-white">
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${getConnectionColor()} transition-colors duration-300`}></div>
                {connectionStatus === 'connected' && (
                  <div className={`absolute inset-0 w-3 h-3 rounded-full ${getConnectionColor()} animate-ping opacity-30`}></div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 capitalize leading-tight">
                  {connectionStatus}
                </span>
                {connectionStatus === 'connecting' && (
                  <span className="text-xs text-gray-500">Joining room...</span>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            {/* User Count with Icon */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 leading-tight">
                  {userCount}
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  {userCount === 1 ? 'user' : 'users'} online
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            {/* Room Share Button */}
            <div className="flex items-center">
              <RoomLink 
                roomId={roomId} 
                variant="secondary" 
                size="sm"
                className="text-xs"
              />
            </div>

            {/* Socket ID - More subtle and collapsible */}
            {socketId && (
              <>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                <div className="group relative">
                  <div className="flex items-center space-x-1 cursor-help">
                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-mono text-gray-600">ID</span>
                    </div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Socket ID: {socketId}
                    <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status message bar */}
          {connectionStatus !== 'connected' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connecting' && (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-600">Establishing connection...</span>
                  </>
                )}
                {connectionStatus === 'disconnected' && (
                  <>
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs text-red-600">Connection lost. Attempting to reconnect...</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Full-screen whiteboard */}
      <Whiteboard 
        ref={whiteboardRef}
        className="w-full h-full"
        roomId={roomId}
        socketService={{
          emitBroadcast,
          emitCursorMove,
          emitClearCanvas
        }}
      />
    </main>
  )
}

export default Room