import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { 
  DrawData, 
  BroadcastMessage,
  UserJoinedEvent, 
  UserLeftEvent, 
  RoomUsersEvent,
  ClearCanvasEvent,
  CursorMoveEvent
} from '@/types/socket.types';

interface UseSocketProps {
  roomId: string;
  userName?: string;
  isAuthenticated?: boolean;
  onDraw?: (data: DrawData) => void;
  onBroadcast?: (data: BroadcastMessage) => void;
  onBoardData?: (data: { _children: any[] }) => void;
  onCanvasState?: (state: string) => void;
  onClearCanvas?: (data: ClearCanvasEvent) => void;
  onUserJoined?: (data: UserJoinedEvent) => void;
  onUserLeft?: (data: UserLeftEvent) => void;
  onRoomUsers?: (data: RoomUsersEvent) => void;
  onCursorMove?: (data: CursorMoveEvent) => void;
}

export const useSocket = ({
  roomId,
  userName,
  isAuthenticated = false,
  onDraw,
  onBroadcast,
  onBoardData,
  onCanvasState,
  onClearCanvas,
  onUserJoined,
  onUserLeft,
  onRoomUsers,
  onCursorMove,
}: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const isInitialized = useRef(false);
  const currentRoomId = useRef<string | null>(null);

  // Store callback refs to avoid dependency issues
  const callbackRefs = useRef({
    onDraw,
    onBroadcast,
    onBoardData,
    onCanvasState,
    onClearCanvas,
    onUserJoined,
    onUserLeft,
    onRoomUsers,
    onCursorMove,
  });

  // Update callback refs when props change
  useEffect(() => {
    callbackRefs.current = {
      onDraw,
      onBroadcast,
      onBoardData,
      onCanvasState,
      onClearCanvas,
      onUserJoined,
      onUserLeft,
      onRoomUsers,
      onCursorMove,
    };
  }, [onDraw, onBroadcast, onBoardData, onCanvasState, onClearCanvas, onUserJoined, onUserLeft, onRoomUsers, onCursorMove]);

  // Initialize socket connection only once
  useEffect(() => {
    if (isInitialized.current) return;

    console.log('🔌 Initializing socket connection...');
    
    // Connect to socket
    const socket = socketService.connect();
    
    // Set up connection listeners
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
      console.log('✅ Socket connected:', socket.id);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(undefined);
      console.log('❌ Socket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set up event listeners with stable references
    const handleDraw = (data: DrawData) => callbackRefs.current.onDraw?.(data);
    const handleBroadcast = (data: BroadcastMessage) => callbackRefs.current.onBroadcast?.(data);
    const handleBoardData = (data: { _children: any[] }) => callbackRefs.current.onBoardData?.(data);
    const handleCanvasState = (state: string) => callbackRefs.current.onCanvasState?.(state);
    const handleClearCanvas = (data: ClearCanvasEvent) => callbackRefs.current.onClearCanvas?.(data);
    const handleUserJoined = (data: UserJoinedEvent) => callbackRefs.current.onUserJoined?.(data);
    const handleUserLeft = (data: UserLeftEvent) => callbackRefs.current.onUserLeft?.(data);
    const handleRoomUsers = (data: RoomUsersEvent) => callbackRefs.current.onRoomUsers?.(data);
    const handleCursorMove = (data: CursorMoveEvent) => callbackRefs.current.onCursorMove?.(data);

    socketService.onDraw(handleDraw);
    socketService.onBroadcast(handleBroadcast);
    socketService.onBoardData(handleBoardData);
    socketService.onCanvasState(handleCanvasState);
    socketService.onClearCanvas(handleClearCanvas);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onRoomUsers(handleRoomUsers);
    socketService.onCursorMove(handleCursorMove);

    isInitialized.current = true;

    // Cleanup only on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection...');
      
      // Remove event listeners
      socketService.offDraw(handleDraw);
      socketService.offBroadcast(handleBroadcast);
      socketService.offBoardData(handleBoardData);
      socketService.offCanvasState(handleCanvasState);
      socketService.offClearCanvas(handleClearCanvas);
      socketService.offUserJoined(handleUserJoined);
      socketService.offUserLeft(handleUserLeft);
      socketService.offCursorMove(handleCursorMove);

      // Leave room and disconnect
      socketService.leaveRoom();
      socketService.disconnect();
      
      isInitialized.current = false;
      currentRoomId.current = null;
    };
  }, []); // Empty dependency array - only run once

  // Handle room changes separately
  useEffect(() => {
    if (!isInitialized.current || !roomId) return;

    // Only join if room changed
    if (currentRoomId.current !== roomId) {
      console.log('🏠 Room changed from', currentRoomId.current, 'to', roomId);
      socketService.joinRoom(roomId, userName, isAuthenticated);
      currentRoomId.current = roomId;
    }
  }, [roomId, userName, isAuthenticated]); // Add userName and isAuthenticated to dependencies

  return {
    socket: socketService,
    isConnected,
    socketId,
    emitDraw: (data: DrawData) => socketService.emitDraw(data),
    emitBroadcast: (message: BroadcastMessage) => socketService.emitBroadcast(message),
    emitCanvasState: (state: string) => socketService.emitCanvasState(state),
    emitClearCanvas: () => socketService.emitClearCanvas(),
    emitCursorMove: (x: number, y: number, color?: string, size?: number, tool?: string) => 
      socketService.emitCursorMove(x, y, color, size, tool),
  };
};
