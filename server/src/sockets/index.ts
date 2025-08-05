import { Server, Socket } from "socket.io";
import { setupYjsHandlers } from "./yjsHandler";

interface DrawData {
  type: 'path' | 'object' | 'clear' | 'undo' | 'redo' | 'cursor' | 'fabric-path' | 'fabric-object';
  data: any;
  userId?: string;
  timestamp?: number;
  tool?: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

interface CursorData {
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
}

interface RoomData {
  [roomId: string]: {
    users: Set<string>;
    userInfo: Map<string, { socketId: string; userName?: string; isAuthenticated?: boolean }>; // Track user details
    canvasState?: string;
    boardData?: any[];
    lastActivity?: number; // Track when room was last active
    codeEditorState?: string; // Track code editor content
  };
}

interface BoardMessage {
  tool?: string;
  type?: string;
  data?: any;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  userId?: string;
  userName?: string; // Add userName to board messages
  timestamp?: number;
}

// Enhanced persistence with better cleanup and state management
const ROOM_CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
const ROOM_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours of inactivity before cleanup

export default function registerSocketHandlers(io: Server) {
  const rooms: RoomData = {};
  const userRooms = new Map<string, string>(); // Track which room each user is in
  const userInfo = new Map<string, { userName?: string; isAuthenticated?: boolean }>(); // Track user info globally

  // Periodic cleanup of inactive rooms
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.lastActivity && (now - room.lastActivity) > ROOM_TIMEOUT) {
        console.log(`🧹 Cleaning up inactive room: ${roomId}`);
        delete rooms[roomId];
      }
    }
  }, ROOM_CLEANUP_INTERVAL);

  // Setup Yjs handlers for code editor collaboration
  setupYjsHandlers(io);

  io.on("connection", (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on("join-room", (roomId: string, userName?: string, isAuthenticated: boolean = false) => {
      // Check if user is already in this room
      const currentRoom = userRooms.get(socket.id);
      if (currentRoom === roomId) {
        console.log(`ℹ️ User ${socket.id} already in room ${roomId}`);
        return;
      }

      // Store user info globally
      userInfo.set(socket.id, { userName, isAuthenticated });

      // Leave current room if in a different one
      if (currentRoom && currentRoom !== roomId) {
        console.log(`🚪 Moving user ${socket.id} from room ${currentRoom} to ${roomId}`);
        handleUserLeave(socket, currentRoom);
      }

      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = { 
          users: new Set(),
          userInfo: new Map(),
          boardData: [],
          lastActivity: Date.now(),
          codeEditorState: ""
        };
      }
      
      // Update room activity
      rooms[roomId].lastActivity = Date.now();
      
      // Store user info in room
      rooms[roomId].users.add(socket.id);
      rooms[roomId].userInfo.set(socket.id, { socketId: socket.id, userName, isAuthenticated });
      userRooms.set(socket.id, roomId);
      
      const displayName = userName || `Guest_${socket.id.slice(0, 4)}`;
      console.log(`🏠 User ${displayName} (${socket.id}) joined room ${roomId} (${rooms[roomId].users.size} users)`);
      
      // Send existing board data to new user immediately
      if (rooms[roomId].boardData && rooms[roomId].boardData.length > 0) {
        console.log(`📋 Sending ${rooms[roomId].boardData.length} existing drawings to new user ${displayName}`);
        socket.emit("board-data", { 
          _children: rooms[roomId].boardData,
          roomId: roomId 
        });
      }
      
      // Also send canvas state if available
      if (rooms[roomId].canvasState) {
        console.log(`🎨 Sending canvas state to new user ${displayName}`);
        try {
          const canvasData = JSON.parse(rooms[roomId].canvasState);
          socket.emit("broadcast", {
            tool: "CanvasSync",
            type: "fullState",
            data: canvasData,
            socket: "server",
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error parsing canvas state:', error);
        }
      }
      
      socket.to(roomId).emit("user-joined", {
        userId: socket.id,
        userCount: rooms[roomId].users.size
      });
      
      if (rooms[roomId].canvasState) {
        socket.emit("canvas-state", rooms[roomId].canvasState);
      }
      
      socket.emit("room-users", {
        userCount: rooms[roomId].users.size,
        users: Array.from(rooms[roomId].users)
      });
    });

    // Whitebophir-style broadcast handler for real-time drawing
    socket.on("broadcast", (message: BoardMessage) => {
      const roomId = message.data?.board || userRooms.get(socket.id);
      if (!roomId || !socket.rooms.has(roomId)) return;

      // Get user info for enriching the message
      const user = userInfo.get(socket.id);

      // Add socket ID, userName, and timestamp to message
      const enrichedMessage = {
        ...message,
        socket: socket.id,
        userName: user?.userName, // Add userName to broadcast messages
        timestamp: Date.now()
      };

      // Handle cursor updates (don't save to board data)
      if (message.tool === "Cursor" || message.type === "cursor") {
        socket.to(roomId).emit("broadcast", enrichedMessage);
        return;
      }

      // Handle canvas sync requests
      if (message.tool === "CanvasSync" && message.type === "fullState") {
        // Update the room's canvas state and broadcast to others
        if (rooms[roomId]) {
          rooms[roomId].canvasState = JSON.stringify(message.data);
        }
        socket.to(roomId).emit("broadcast", enrichedMessage);
        return;
      }

      // Save drawing data to room's board data
      if (rooms[roomId] && message.tool && message.tool !== "Cursor") {
        if (!rooms[roomId].boardData) {
          rooms[roomId].boardData = [];
        }
        rooms[roomId].boardData.push(enrichedMessage);
        
        // Keep only last 1000 drawing operations to prevent memory issues
        if (rooms[roomId].boardData!.length > 1000) {
          rooms[roomId].boardData = rooms[roomId].boardData!.slice(-1000);
        }
      }

      // Broadcast to other users in the room
      socket.to(roomId).emit("broadcast", enrichedMessage);
    });

    socket.on("draw", ({ roomId, data }: { roomId: string; data: DrawData }) => {
      const drawData = {
        ...data,
        userId: socket.id,
        timestamp: Date.now()
      };
      
      socket.to(roomId).emit("draw", drawData);
    });

    socket.on("canvas-state", ({ roomId, state }: { roomId: string; state: string }) => {
      if (rooms[roomId]) {
        rooms[roomId].canvasState = state;
      }
      socket.to(roomId).emit("canvas-state", state);
    });

    socket.on("cursor-move", ({ roomId, x, y, color, size, tool }: { 
      roomId: string; 
      x: number; 
      y: number;
      color?: string;
      size?: number;
      tool?: string;
    }) => {
      // Get user info for this socket
      const user = userInfo.get(socket.id);
      const userName = user?.userName;
      
      socket.to(roomId).emit("cursor-move", {
        userId: socket.id,
        userName, // Include userName from stored user info
        x,
        y,
        color,
        size,
        tool
      });
    });

    socket.on("clear-canvas", ({ roomId }: { roomId: string }) => {
      if (rooms[roomId]) {
        rooms[roomId].canvasState = undefined;
        rooms[roomId].boardData = []; // Clear board data
        rooms[roomId].lastActivity = Date.now();
      }
      socket.to(roomId).emit("clear-canvas", { userId: socket.id });
    });

    // Code editor state persistence
    socket.on("save-code-state", ({ roomId, code }: { roomId: string; code: string }) => {
      if (rooms[roomId]) {
        rooms[roomId].codeEditorState = code;
        rooms[roomId].lastActivity = Date.now();
        console.log(`💾 Saved code editor state for room: ${roomId}`);
      }
    });

    socket.on("get-code-state", ({ roomId }: { roomId: string }) => {
      if (rooms[roomId] && rooms[roomId].codeEditorState) {
        socket.emit("code-state", { 
          roomId, 
          code: rooms[roomId].codeEditorState 
        });
        console.log(`📤 Sent code editor state for room: ${roomId}`);
      }
    });

    socket.on("leave-room", (roomId: string) => {
      handleUserLeave(socket, roomId);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      
      // Get the user's current room
      const currentRoom = userRooms.get(socket.id);
      if (currentRoom) {
        handleUserLeave(socket, currentRoom);
      }
      
      // Clean up user tracking
      userRooms.delete(socket.id);
      userInfo.delete(socket.id); // Clean up global user info
    });

    function handleUserLeave(socket: Socket, roomId: string) {
      socket.leave(roomId);
      
      if (rooms[roomId]) {
        rooms[roomId].users.delete(socket.id);
        rooms[roomId].userInfo.delete(socket.id); // Clean up room-specific user info
        
        socket.to(roomId).emit("user-left", {
          userId: socket.id,
          userCount: rooms[roomId].users.size
        });
        
        if (rooms[roomId].users.size === 0) {
          delete rooms[roomId];
          console.log(`🧹 Room ${roomId} cleaned up`);
        } else {
          console.log(`👋 User ${socket.id} left room ${roomId} (${rooms[roomId].users.size} users remaining)`);
        }
      }
      
      // Remove from user tracking
      userRooms.delete(socket.id);
    }
  });
}