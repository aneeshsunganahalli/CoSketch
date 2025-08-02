import { Server, Socket } from "socket.io";

interface DrawData {
  type: 'path' | 'object' | 'clear' | 'undo' | 'redo';
  data: any;
  userId?: string;
  timestamp?: number;
}

interface RoomData {
  [roomId: string]: {
    users: Set<string>;
    canvasState?: string;
  };
}

export default function registerSocketHandlers(io: Server) {
  const rooms: RoomData = {};
  const userRooms = new Map<string, string>(); // Track which room each user is in

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
        rooms[roomId] = { users: new Set() };
      }
      
      rooms[roomId].users.add(socket.id);
      userRooms.set(socket.id, roomId);
      console.log(`🏠 User ${socket.id} joined room ${roomId} (${rooms[roomId].users.size} users)`);
      
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

    socket.on("cursor-move", ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
      socket.to(roomId).emit("cursor-move", {
        userId: socket.id,
        x,
        y
      });
    });

    socket.on("clear-canvas", ({ roomId }: { roomId: string }) => {
      if (rooms[roomId]) {
        rooms[roomId].canvasState = undefined;
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