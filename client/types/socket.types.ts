export interface DrawData {
  type: 'path' | 'object' | 'clear' | 'undo' | 'redo';
  data: any;
  userId?: string;
  timestamp?: number;
}

export interface RoomData {
  [roomId: string]: {
    users: Set<string>;
    canvasState?: string;
  };
}

export interface UserCursor {
  userId: string;
  x: number;
  y: number;
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
  x: number;
  y: number;
}