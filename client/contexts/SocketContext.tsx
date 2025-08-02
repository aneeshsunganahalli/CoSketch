import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService } from '@/lib/socket';
import { 
  DrawData, 
  UserJoinedEvent, 
  UserLeftEvent, 
  RoomUsersEvent,
  ClearCanvasEvent,
  CursorMoveEvent
} from '@/types/socket.types';

interface SocketContextValue {
  isConnected: boolean;
  socketId: string | undefined;
  currentRoomId: string | null;
  userCount: number;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  emitDraw: (data: DrawData) => void;
  emitCanvasState: (state: string) => void;
  emitClearCanvas: () => void;
  emitCursorMove: (x: number, y: number) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(1);

  useEffect(() => {
    // Connect to socket when provider mounts
    const socket = socketService.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setSocketId(socket.id);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setSocketId(undefined);
      console.log('Socket disconnected');
    });

    // Set up global event listeners
    socketService.onUserJoined((data: UserJoinedEvent) => {
      console.log('User joined:', data);
      setUserCount(data.userCount);
    });

    socketService.onUserLeft((data: UserLeftEvent) => {
      console.log('User left:', data);
      setUserCount(data.userCount);
    });

    socketService.onRoomUsers((data: RoomUsersEvent) => {
      console.log('Room users:', data);
      setUserCount(data.userCount);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string) => {
    socketService.joinRoom(roomId);
    setCurrentRoomId(roomId);
  };

  const leaveRoom = () => {
    socketService.leaveRoom();
    setCurrentRoomId(null);
  };

  const emitDraw = (data: DrawData) => {
    socketService.emitDraw(data);
  };

  const emitCanvasState = (state: string) => {
    socketService.emitCanvasState(state);
  };

  const emitClearCanvas = () => {
    socketService.emitClearCanvas();
  };

  const emitCursorMove = (x: number, y: number) => {
    socketService.emitCursorMove(x, y);
  };

  const value: SocketContextValue = {
    isConnected,
    socketId,
    currentRoomId,
    userCount,
    joinRoom,
    leaveRoom,
    emitDraw,
    emitCanvasState,
    emitClearCanvas,
    emitCursorMove,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
