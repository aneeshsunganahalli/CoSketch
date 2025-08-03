import io from 'socket.io-client';
import { 
  DrawData, 
  UserCursor, 
  UserJoinedEvent, 
  UserLeftEvent, 
  RoomUsersEvent,
  ClearCanvasEvent,
  CursorMoveEvent
} from '@/types/socket.types';

type SocketInstance = ReturnType<typeof io>;

interface BroadcastMessage {
  tool?: string;
  type?: string;
  data?: any;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  socket?: string;
  timestamp?: number;
}

class SocketService {
  private static instance: SocketService | null = null;
  private socket: SocketInstance | null = null;
  private roomId: string | null = null;

  // Singleton pattern to prevent multiple instances
  constructor() {
    if (SocketService.instance) {
      return SocketService.instance;
    }
    SocketService.instance = this;
  }

  connect(serverUrl: string = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000') {
    // If already connected, return existing socket
    if (this.socket && this.socket.connected) {
      console.log('🔄 Using existing connection:', this.socket.id);
      return this.socket;
    }

    // If socket exists but disconnected, clean it up first
    if (this.socket) {
      console.log('🧹 Cleaning up previous socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🚀 Creating new socket connection to:', serverUrl);
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false, // Use existing connection if available
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔥 Connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('🔥 Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('💀 Failed to reconnect to server');
    });
  }

  // Room methods
  joinRoom(roomId: string) {
    if (!this.socket) {
      console.warn('⚠️ Cannot join room: No socket connection');
      return;
    }

    // If already in the same room, don't rejoin
    if (this.roomId === roomId) {
      console.log('ℹ️ Already in room:', roomId);
      return;
    }

    // Leave current room if in a different one
    if (this.roomId && this.roomId !== roomId) {
      console.log('🚪 Leaving current room:', this.roomId);
      this.socket.emit('leave-room', this.roomId);
    }

    console.log('🏠 Joining room:', roomId);
    this.roomId = roomId;
    this.socket.emit('join-room', roomId);
  }

  leaveRoom() {
    if (!this.socket || !this.roomId) return;
    
    console.log('🚪 Leaving room:', this.roomId);
    this.socket.emit('leave-room', this.roomId);
    this.roomId = null;
  }

  // Drawing methods
  emitBroadcast(message: BroadcastMessage) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('broadcast', {
      ...message,
      data: { board: this.roomId, ...message.data }
    });
  }

  emitDraw(data: DrawData) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('draw', { roomId: this.roomId, data });
  }

  emitCanvasState(state: string) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('canvas-state', { roomId: this.roomId, state });
  }

  emitClearCanvas() {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('clear-canvas', { roomId: this.roomId });
  }

  emitCursorMove(x: number, y: number, color?: string, size?: number, tool?: string) {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('cursor-move', { 
      roomId: this.roomId, 
      x, 
      y, 
      color, 
      size, 
      tool 
    });
  }

  // Event listeners
  onBroadcast(callback: (data: BroadcastMessage) => void) {
    this.socket?.on('broadcast', callback);
  }

  onBoardData(callback: (data: { _children: any[] }) => void) {
    this.socket?.on('board-data', callback);
  }
  onDraw(callback: (data: DrawData) => void) {
    this.socket?.on('draw', callback);
  }

  onCanvasState(callback: (state: string) => void) {
    this.socket?.on('canvas-state', callback);
  }

  onClearCanvas(callback: (data: ClearCanvasEvent) => void) {
    this.socket?.on('clear-canvas', callback);
  }

  onCursorMove(callback: (data: CursorMoveEvent) => void) {
    this.socket?.on('cursor-move', callback);
  }

  onUserJoined(callback: (data: UserJoinedEvent) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: UserLeftEvent) => void) {
    this.socket?.on('user-left', callback);
  }

  onRoomUsers(callback: (data: RoomUsersEvent) => void) {
    this.socket?.on('room-users', callback);
  }

  // Remove event listeners
  offDraw(callback?: (data: DrawData) => void) {
    if (callback) {
      this.socket?.off('draw', callback);
    } else {
      this.socket?.off('draw');
    }
  }

  offBroadcast(callback?: (data: BroadcastMessage) => void) {
    if (callback) {
      this.socket?.off('broadcast', callback);
    } else {
      this.socket?.off('broadcast');
    }
  }

  offBoardData(callback?: (data: { _children: any[] }) => void) {
    if (callback) {
      this.socket?.off('board-data', callback);
    } else {
      this.socket?.off('board-data');
    }
  }

  offCanvasState(callback?: (state: string) => void) {
    if (callback) {
      this.socket?.off('canvas-state', callback);
    } else {
      this.socket?.off('canvas-state');
    }
  }

  offClearCanvas(callback?: (data: ClearCanvasEvent) => void) {
    if (callback) {
      this.socket?.off('clear-canvas', callback);
    } else {
      this.socket?.off('clear-canvas');
    }
  }

  offCursorMove(callback?: (data: CursorMoveEvent) => void) {
    if (callback) {
      this.socket?.off('cursor-move', callback);
    } else {
      this.socket?.off('cursor-move');
    }
  }

  offUserJoined(callback?: (data: UserJoinedEvent) => void) {
    if (callback) {
      this.socket?.off('user-joined', callback);
    } else {
      this.socket?.off('user-joined');
    }
  }

  offUserLeft(callback?: (data: UserLeftEvent) => void) {
    if (callback) {
      this.socket?.off('user-left', callback);
    } else {
      this.socket?.off('user-left');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getCurrentRoomId(): string | null {
    return this.roomId;
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket:', this.socket.id);
      
      // Leave room before disconnecting
      if (this.roomId) {
        this.socket.emit('leave-room', this.roomId);
        this.roomId = null;
      }

      // Remove all listeners to prevent memory leaks
      this.socket.removeAllListeners();
      
      // Disconnect the socket
      this.socket.disconnect();
      this.socket = null;
      
      console.log('✅ Socket disconnected and cleaned up');
    }
  }
}

export const socketService = new SocketService();