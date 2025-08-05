import { Server, Socket } from "socket.io";
import * as Y from "yjs";

interface YjsRoom {
  doc: Y.Doc;
  userCount: number;
}

// Store Yjs documents for each room
const yjsRooms = new Map<string, YjsRoom>();

export function setupYjsHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    
    socket.on("yjs-join-room", (roomId: string) => {
      console.log(`📝 User ${socket.id} joining Yjs room: ${roomId}`);
      
      socket.join(`yjs-${roomId}`);
      
      // Create or get existing room
      if (!yjsRooms.has(roomId)) {
        yjsRooms.set(roomId, {
          doc: new Y.Doc(),
          userCount: 0
        });
      }
      
      const room = yjsRooms.get(roomId)!;
      room.userCount++;
      
      // Send the current state of the document to the new user
      const state = Y.encodeStateAsUpdate(room.doc);
      socket.emit("yjs-sync", { roomId, update: Array.from(state) });
      
      console.log(`📝 User count in Yjs room ${roomId}: ${room.userCount}`);
    });

    socket.on("yjs-update", ({ roomId, update }: { roomId: string; update: number[] }) => {
      const room = yjsRooms.get(roomId);
      if (!room) return;

      try {
        // Apply the update to the document
        Y.applyUpdate(room.doc, new Uint8Array(update));
        
        // Broadcast the update to all other clients in the room
        socket.to(`yjs-${roomId}`).emit("yjs-update", { roomId, update });
        
        console.log(`📝 Yjs update applied and broadcasted for room: ${roomId}`);
      } catch (error) {
        console.error(`❌ Error applying Yjs update for room ${roomId}:`, error);
      }
    });

    socket.on("yjs-leave-room", (roomId: string) => {
      handleYjsLeave(socket, roomId);
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {
      // Find which Yjs rooms this socket was in and clean up
      for (const [roomId, room] of yjsRooms.entries()) {
        if (socket.rooms.has(`yjs-${roomId}`)) {
          handleYjsLeave(socket, roomId);
        }
      }
    });
  });

  function handleYjsLeave(socket: Socket, roomId: string) {
    console.log(`📝 User ${socket.id} leaving Yjs room: ${roomId}`);
    
    socket.leave(`yjs-${roomId}`);
    
    const room = yjsRooms.get(roomId);
    if (room) {
      room.userCount--;
      
      // Clean up empty rooms
      if (room.userCount <= 0) {
        room.doc.destroy();
        yjsRooms.delete(roomId);
        console.log(`🧹 Yjs room ${roomId} cleaned up`);
      } else {
        console.log(`📝 User count in Yjs room ${roomId}: ${room.userCount}`);
      }
    }
  }
}
