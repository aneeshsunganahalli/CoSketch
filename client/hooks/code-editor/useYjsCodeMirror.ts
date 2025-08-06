import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { socketService } from '@/lib/socket';

interface UseYjsCodeMirrorProps {
  roomId: string;
  socketInstance?: any;
}

interface YjsCodeMirrorProvider {
  ydoc: Y.Doc | null;
  ytext: Y.Text | null;
  isConnected: boolean;
  userCount: number;
}

export const useYjsCodeMirror = ({ 
  roomId,
  socketInstance 
}: UseYjsCodeMirrorProps): YjsCodeMirrorProvider => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return;

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // Use the shared socket instance or get from socketService
    const socket = socketInstance || socketService.connect();

    // Set connection status based on socket state
    setIsConnected(socket.connected);

    const handleConnect = () => {
      console.log('📝 Connected to Yjs server for CodeMirror');
      setIsConnected(true);
      
      // Join the Yjs room using shared socket
      socket.emit('yjs-join-room', roomId);
    };

    const handleDisconnect = () => {
      console.log('📝 Disconnected from Yjs server');
      setIsConnected(false);
    };

    const handleUserCountUpdate = (count: number) => {
      setUserCount(count);
    };

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('yjs-user-count', handleUserCountUpdate);

    // If already connected, join room immediately
    if (socket.connected) {
      handleConnect();
    }

    // Handle initial sync
    socket.on('yjs-sync', ({ roomId: syncRoomId, update }: { roomId: string; update: number[] }) => {
      if (syncRoomId === roomId) {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update));
          console.log('📝 Applied initial Yjs sync for CodeMirror');
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
          console.log('📝 Applied Yjs update from server for CodeMirror');
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
        console.log('📝 Sent Yjs update to server from CodeMirror');
      }
    };

    ydoc.on('update', updateHandler);

    return () => {
      console.log('📝 Cleaning up Yjs CodeMirror provider');
      
      // Leave the room
      if (socket.connected) {
        socket.emit('yjs-leave-room', roomId);
      }
      
      // Clean up event listeners
      ydoc.off('update', updateHandler);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('yjs-user-count', handleUserCountUpdate);
      socket.off('yjs-sync');
      socket.off('yjs-update');
      
      // Only destroy the document, don't disconnect the shared socket
      ydoc.destroy();
      
      // Reset refs
      ydocRef.current = null;
      ytextRef.current = null;
    };
  }, [roomId, socketInstance]);

  return {
    ydoc: ydocRef.current,
    ytext: ytextRef.current,
    isConnected,
    userCount
  };
};
