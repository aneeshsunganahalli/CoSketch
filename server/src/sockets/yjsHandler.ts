import { Server, Socket } from "socket.io";
import * as Y from "yjs";

interface YjsRoom {
  doc: Y.Doc;
  users: Set<string>; // Track user IDs instead of count
  lastActivity: number;
  awareness: Map<string, any>; // Store awareness states
}

// Store Yjs documents for each room
const yjsRooms = new Map<string, YjsRoom>();

// Cleanup inactive Yjs rooms periodically
const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
const ROOM_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of yjsRooms.entries()) {
    if ((now - room.lastActivity) > ROOM_TIMEOUT) {
      console.log(`🧹 Cleaning up inactive Yjs room: ${roomId}`);
      room.doc.destroy();
      yjsRooms.delete(roomId);
    }
  }
}, CLEANUP_INTERVAL);

export function setupYjsHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    
    socket.on("yjs-join-room", (roomId: string) => {
      console.log(`📝 User ${socket.id} joining Yjs room: ${roomId}`);
      
      socket.join(`yjs-${roomId}`);
      
      // Create or get existing room
      if (!yjsRooms.has(roomId)) {
        yjsRooms.set(roomId, {
          doc: new Y.Doc(),
          users: new Set(),
          lastActivity: Date.now(),
          awareness: new Map()
        });
      }
      
      const room = yjsRooms.get(roomId)!;
      room.users.add(socket.id);
      room.lastActivity = Date.now();
      
      // Send the current state of the document to the new user
      const state = Y.encodeStateAsUpdate(room.doc);
      socket.emit("yjs-sync", { roomId, update: Array.from(state) });
      
      // Send current awareness states to new user
      for (const [userId, awarenessState] of room.awareness.entries()) {
        if (userId !== socket.id) {
          socket.emit("yjs-awareness-update", { 
            roomId, 
            userId,
            awarenessState 
          });
        }
      }
      
      console.log(`📝 User count in Yjs room ${roomId}: ${room.users.size}`);
      
      // Broadcast user count update
      io.to(`yjs-${roomId}`).emit("user-count-update", {
        roomId,
        count: room.users.size
      });
    });

    socket.on("yjs-update", ({ roomId, update }: { roomId: string; update: number[] }) => {
      const room = yjsRooms.get(roomId);
      if (!room) return;

      try {
        // Update activity
        room.lastActivity = Date.now();
        
        // Apply the update to the document
        Y.applyUpdate(room.doc, new Uint8Array(update));
        
        // Broadcast the update to all other clients in the room
        socket.to(`yjs-${roomId}`).emit("yjs-update", { roomId, update });
        
        console.log(`📝 Yjs update applied and broadcasted for room: ${roomId}`);
      } catch (error) {
        console.error(`❌ Error applying Yjs update for room ${roomId}:`, error);
      }
    });

    // Handle awareness updates for remote cursors
    socket.on("yjs-awareness-update", ({ roomId, awarenessState }: { roomId: string; awarenessState: any }) => {
      const room = yjsRooms.get(roomId);
      if (!room) return;

      try {
        // Store awareness state
        room.awareness.set(socket.id, awarenessState);
        room.lastActivity = Date.now();
        
        // Broadcast awareness update to other clients
        socket.to(`yjs-${roomId}`).emit("yjs-awareness-update", { 
          roomId, 
          userId: socket.id,
          awarenessState 
        });
        
        console.log(`👁️ Awareness update for user ${socket.id} in room ${roomId}`);
      } catch (error) {
        console.error(`❌ Error handling awareness update for room ${roomId}:`, error);
      }
    });

    socket.on("yjs-leave-room", (roomId: string) => {
      handleYjsLeave(socket, roomId, io);
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {
      // Find which Yjs rooms this socket was in and clean up
      for (const [roomId, room] of yjsRooms.entries()) {
        if (socket.rooms.has(`yjs-${roomId}`)) {
          handleYjsLeave(socket, roomId, io);
        }
      }
    });
  });

  function handleYjsLeave(socket: Socket, roomId: string, io: Server) {
    console.log(`📝 User ${socket.id} leaving Yjs room: ${roomId}`);
    
    socket.leave(`yjs-${roomId}`);
    
    const room = yjsRooms.get(roomId);
    if (room) {
      room.users.delete(socket.id);
      room.awareness.delete(socket.id);
      
      // Broadcast awareness removal
      socket.to(`yjs-${roomId}`).emit("yjs-awareness-remove", { 
        roomId, 
        userId: socket.id 
      });
      
      // Clean up empty rooms
      if (room.users.size <= 0) {
        room.doc.destroy();
        yjsRooms.delete(roomId);
        console.log(`🧹 Yjs room ${roomId} cleaned up`);
      } else {
        console.log(`📝 User count in Yjs room ${roomId}: ${room.users.size}`);
        
        // Broadcast user count update
        io.to(`yjs-${roomId}`).emit("user-count-update", {
          roomId,
          count: room.users.size
        });
      }
    }
  }
}
