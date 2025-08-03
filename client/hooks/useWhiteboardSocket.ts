'use client';

import { useCallback, useRef, useState } from 'react';
import { Path } from 'fabric';
import { BroadcastMessage } from '@/types/socket.types';

interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
  lastSeen: number;
}

export const useWhiteboardSocket = (socketService?: any, fabricRef?: any, isUpdatingFromHistory?: boolean, setIsUpdatingFromHistory?: any) => {
  const remoteCursors = useRef<Map<string, RemoteCursor>>(new Map());
  const lastCursorUpdate = useRef<number>(0);
  const [, setRemoteCursorsUpdate] = useState(0);

  const handleRemoteCursor = useCallback((message: BroadcastMessage) => {
    if (!message.socket || !message.x || !message.y) return;
    
    const cursor: RemoteCursor = {
      userId: message.socket,
      x: message.x,
      y: message.y,
      color: message.color,
      size: message.size,
      tool: message.tool,
      lastSeen: Date.now()
    };
    
    remoteCursors.current.set(message.socket, cursor);
    setRemoteCursorsUpdate(prev => prev + 1);
  }, []);

  const handleRemoteDrawing = useCallback((message: BroadcastMessage) => {
    if (!fabricRef?.current || isUpdatingFromHistory) return;
    
    console.log('Received remote drawing message:', message);
    
    const canvas = fabricRef.current;
    setIsUpdatingFromHistory?.(true);
    
    try {
      if ((message.tool === 'pen' || message.tool === 'marker') && message.data) {
        console.log('Creating path from remote data:', message.data);
        
        Path.fromObject(message.data).then((path) => {
          if (path) {
            canvas.add(path);
            canvas.renderAll();
            console.log('Added remote path to canvas');
          }
        }).catch((error) => {
          console.error('Error creating path from remote data:', error);
        });
      }
    } catch (error) {
      console.error('Error handling remote drawing:', error);
    } finally {
      setTimeout(() => {
        setIsUpdatingFromHistory?.(false);
      }, 100);
    }
  }, [fabricRef, isUpdatingFromHistory, setIsUpdatingFromHistory]);

  const syncCanvasState = useCallback(() => {
    if (!fabricRef?.current || !socketService || isUpdatingFromHistory) return;
    
    try {
      const canvas = fabricRef.current;
      const canvasState = canvas.toJSON();
      
      socketService.emitBroadcast({
        tool: 'CanvasSync',
        type: 'fullState',
        data: canvasState
      });
      
      console.log('Synced canvas state for new users');
    } catch (error) {
      console.error('Error syncing canvas state:', error);
    }
  }, [socketService, fabricRef, isUpdatingFromHistory]);

  const handleCanvasStateRestore = useCallback((canvasState: any) => {
    if (!fabricRef?.current || isUpdatingFromHistory) return;
    
    console.log('Restoring canvas state:', canvasState);
    
    const canvas = fabricRef.current;
    setIsUpdatingFromHistory?.(true);
    
    try {
      canvas.loadFromJSON(canvasState, () => {
        canvas.renderAll();
        console.log('Canvas state restored successfully');
        
        setTimeout(() => {
          setIsUpdatingFromHistory?.(false);
        }, 100);
      });
    } catch (error) {
      console.error('Error restoring canvas state:', error);
      setIsUpdatingFromHistory?.(false);
    }
  }, [fabricRef, isUpdatingFromHistory, setIsUpdatingFromHistory]);

  const loadExistingBoardData = useCallback((boardData: any[]) => {
    if (!fabricRef?.current || !boardData.length) return;
    
    console.log('Loading existing board data:', boardData);
    
    const canvas = fabricRef.current;
    setIsUpdatingFromHistory?.(true);
    
    try {
      boardData.forEach((message, index) => {
        setTimeout(() => {
          if (!fabricRef?.current) return;
          
          if (message.tool === 'pen' || message.tool === 'marker') {
            if (message.data) {
              console.log(`Loading drawing ${index + 1}/${boardData.length}:`, message.data);
              
              Path.fromObject(message.data).then((path) => {
                if (path && fabricRef?.current) {
                  fabricRef.current.add(path);
                  fabricRef.current.renderAll();
                }
              }).catch((error) => {
                console.error('Error loading path:', error);
              });
            }
          }
          
          if (index === boardData.length - 1) {
            setTimeout(() => {
              setIsUpdatingFromHistory?.(false);
            }, 200);
          }
        }, index * 10);
      });
    } catch (error) {
      console.error('Error loading board data:', error);
      setIsUpdatingFromHistory?.(false);
    }
  }, [fabricRef, setIsUpdatingFromHistory]);

  const handleRemoteClear = useCallback(() => {
    if (fabricRef?.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = '#ffffff';
      fabricRef.current.renderAll();
    }
  }, [fabricRef]);

  const handleMouseMove = useCallback((e: MouseEvent, state: any) => {
    if (!fabricRef?.current || !socketService) return;
    
    const canvas = fabricRef.current;
    const rect = canvas.getElement().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const now = Date.now();
    const CURSOR_UPDATE_THROTTLE = 50;
    
    if (now - lastCursorUpdate.current > CURSOR_UPDATE_THROTTLE) {
      socketService.emitCursorMove(x, y, state.brushColor, state.brushSize, state.selectedTool);
      lastCursorUpdate.current = now;
      
      socketService.emitBroadcast({
        tool: 'Cursor',
        type: 'update',
        x,
        y,
        color: state.brushColor,
        size: state.brushSize
      });
    }
  }, [socketService, fabricRef]);

  const handleRemoteMessage = useCallback((message: BroadcastMessage) => {
    if (message.tool === 'Cursor') {
      handleRemoteCursor(message);
    } else if (message.tool === 'CanvasSync' && message.type === 'fullState') {
      handleCanvasStateRestore(message.data);
    } else {
      handleRemoteDrawing(message);
    }
  }, [handleRemoteCursor, handleCanvasStateRestore, handleRemoteDrawing]);

  return {
    remoteCursors, 
    handleRemoteCursor,
    handleRemoteDrawing,
    syncCanvasState,
    handleCanvasStateRestore,
    loadExistingBoardData,
    handleRemoteClear,
    handleMouseMove,
    handleRemoteMessage,
  };
};
