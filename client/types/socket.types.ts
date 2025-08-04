export interface DrawData {
  type: 'path' | 'object' | 'clear' | 'undo' | 'redo' | 'cursor' | 'fabric-path' | 'fabric-object';
  data: any;
  userId?: string;
  timestamp?: number;
}

export interface BroadcastMessage {
  tool?: string;
  type?: string;
  data?: any;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  socket?: string;
  userName?: string;
  timestamp?: number;
}

export interface RoomData {
  [roomId: string]: {
    users: Set<string>;
    canvasState?: string;
    boardData?: any[];
  };
}

export interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
}

export interface RoomUser {
  socketId: string;
  userId?: string;
  joinedAt: number;
}

export interface UserJoinedEvent {
  userId: string;
  userCount: number;
}

export interface UserLeftEvent {
  userId: string;
  userCount: number;
}

export interface RoomUsersEvent {
  userCount: number;
  users: string[];
}

export interface ClearCanvasEvent {
  userId: string;
}

export interface CursorMoveEvent {
  userId: string;
  userName?: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
}