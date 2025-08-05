import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import io from 'socket.io-client';

interface UseYjsProviderProps {
  roomId: string;
  serverUrl?: string;
}

interface YjsProvider {
  ydoc: Y.Doc;
  ytext: Y.Text;
  isConnected: boolean;
  userCount: number;
}

export const useYjsProvider = ({ 
  roomId, 
  serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000' 
}: UseYjsProviderProps): YjsProvider => {
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return;

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // Initialize socket connection
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📝 Connected to Yjs server');
      setIsConnected(true);
      
      // Join the Yjs room
      socket.emit('yjs-join-room', roomId);
    });

    socket.on('disconnect', () => {
      console.log('📝 Disconnected from Yjs server');
      setIsConnected(false);
    });

    // Handle initial sync
    socket.on('yjs-sync', ({ roomId: syncRoomId, update }: { roomId: string; update: number[] }) => {
      if (syncRoomId === roomId) {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update));
          console.log('📝 Applied initial Yjs sync');
        } catch (error) {
          console.error('❌ Error applying initial Yjs sync:', error);
        }
      }
    });

    // Handle updates from other clients
    socket.on('yjs-update', ({ roomId: updateRoomId, update }: { roomId: string; update: number[] }) => {
      if (updateRoomId === roomId) {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update));
          console.log('📝 Applied Yjs update from server');
        } catch (error) {
          console.error('❌ Error applying Yjs update:', error);
        }
      }
    });

    // Listen for document updates and send them to the server
    const updateHandler = (update: Uint8Array, origin: any) => {
      // Don't send updates that originated from the server
      if (origin !== socket) {
        socket.emit('yjs-update', { 
          roomId, 
          update: Array.from(update) 
        });
        console.log('📝 Sent Yjs update to server');
      }
    };

    ydoc.on('update', updateHandler);

    return () => {
      console.log('📝 Cleaning up Yjs provider');
      
      // Leave the room
      if (socket.connected) {
        socket.emit('yjs-leave-room', roomId);
      }
      
      // Clean up event listeners
      ydoc.off('update', updateHandler);
      
      // Disconnect socket
      socket.disconnect();
      
      // Destroy Yjs document
      ydoc.destroy();
      
      // Reset refs
      ydocRef.current = null;
      ytextRef.current = null;
      socketRef.current = null;
    };
  }, [roomId, serverUrl]);

  return {
    ydoc: ydocRef.current!,
    ytext: ytextRef.current!,
    isConnected,
    userCount
  };
};
