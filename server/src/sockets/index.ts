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
    canvasState?: string;
    boardData?: any[];
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
  timestamp?: number;
}

export default function registerSocketHandlers(io: Server) {
  const rooms: RoomData = {};
  const userRooms = new Map<string, string>(); // Track which room each user is in

  // Setup Yjs handlers for code editor collaboration
  setupYjsHandlers(io);

  io.on("connection", (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on("join-room", (roomId: string, userId?: string) => {
      // Check if user is already in this room
      const currentRoom = userRooms.get(socket.id);
      if (currentRoom === roomId) {
        console.log(`ℹ️ User ${socket.id} already in room ${roomId}`);
        return;
      }

      // Leave current room if in a different one
      if (currentRoom && currentRoom !== roomId) {
        console.log(`🚪 Moving user ${socket.id} from room ${currentRoom} to ${roomId}`);
        handleUserLeave(socket, currentRoom);
      }

      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = { 
          users: new Set(),
          boardData: []
        };
      }
      
      rooms[roomId].users.add(socket.id);
      userRooms.set(socket.id, roomId);
      console.log(`🏠 User ${socket.id} joined room ${roomId} (${rooms[roomId].users.size} users)`);
      
      // Send existing board data to new user immediately
      if (rooms[roomId].boardData && rooms[roomId].boardData.length > 0) {
        console.log(`📋 Sending ${rooms[roomId].boardData.length} existing drawings to new user ${socket.id}`);
        socket.emit("board-data", { 
          _children: rooms[roomId].boardData,
          roomId: roomId 
        });
      }
      
      // Also send canvas state if available
      if (rooms[roomId].canvasState) {
        console.log(`🎨 Sending canvas state to new user ${socket.id}`);
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

      // Add socket ID and timestamp to message
      const enrichedMessage = {
        ...message,
        socket: socket.id,
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
      socket.to(roomId).emit("cursor-move", {
        userId: socket.id,
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
      }
      socket.to(roomId).emit("clear-canvas", { userId: socket.id });
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
    });

    function handleUserLeave(socket: Socket, roomId: string) {
      socket.leave(roomId);
      
      if (rooms[roomId]) {
        rooms[roomId].users.delete(socket.id);
        
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