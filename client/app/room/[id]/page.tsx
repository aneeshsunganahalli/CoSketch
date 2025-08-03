'use client'

import Whiteboard from "@/components/WhiteBoard";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import React, { useState, useEffect, useRef } from "react";
import { DrawData, BroadcastMessage, UserJoinedEvent, UserLeftEvent, RoomUsersEvent } from "@/types/socket.types";

const Room = () => {
  const { id } = useParams();
  const roomId = id as string;
  
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
    onUserJoined: (data: UserJoinedEvent) => {
      console.log('User joined:', data);
      setUserCount(data.userCount);
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
    onBoardData: (data: { _children: any[] }) => {
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
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-white">
      {/* Room header */}
      <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
        <h1 className="text-sm font-semibold text-gray-700">Room: {roomId}</h1>
      </div>

      {/* Connection status and user count */}
      <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`}></div>
            <span className="text-sm text-gray-700 capitalize">{connectionStatus}</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="text-sm text-gray-700">
            {userCount} user{userCount !== 1 ? 's' : ''}
          </div>
          {socketId && (
            <>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-xs text-gray-500">
                ID: {socketId.slice(0, 6)}...
              </div>
            </>
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