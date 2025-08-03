'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { Toolbar } from './whiteboard/Toolbar';
import { CanvasControls } from './whiteboard/CanvasControls';
import { WhiteboardState } from './whiteboard/types';
import { BroadcastMessage } from '@/types/socket.types';
import RemoteCursors from './whiteboard/RemoteCursors';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useWhiteboardSocket } from '@/hooks/useWhiteboardSocket';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useCanvasInitialization } from '@/hooks/useCanvasInitialization';

interface WhiteboardProps {
  className?: string;
  roomId?: string;
  socketService?: {
    emitBroadcast: (message: BroadcastMessage) => void;
    emitCursorMove: (x: number, y: number, color?: string, size?: number, tool?: string) => void;
    emitClearCanvas: () => void;
  };
}

const MiroWhiteboard = forwardRef<any, WhiteboardProps>(({ className = '', roomId, socketService }, ref) => {
  // Use custom hooks to manage complex logic
  const whiteboard = useWhiteboard(socketService);
  const socket = useWhiteboardSocket(
    socketService,
    whiteboard.fabricRef,
    whiteboard.isUpdatingFromHistory,
    whiteboard.setIsUpdatingFromHistory
  );
  
  const canvasEvents = useCanvasEvents(
    whiteboard.fabricRef,
    whiteboard.state,
    whiteboard.setState,
    whiteboard.isDragging,
    whiteboard.setIsDragging,
    whiteboard.lastPanPoint,
    whiteboard.setLastPanPoint,
    whiteboard.isUpdatingFromHistory,
    socketService,
    whiteboard.addText
  );

  // Initialize canvas
  useCanvasInitialization(
    whiteboard.canvasRef,
    whiteboard.containerRef,
    whiteboard.fabricRef,
    whiteboard.state,
    canvasEvents.setupCanvasEvents,
    whiteboard.updateToolSettings,
    socket.handleMouseMove,
    socketService
  );

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleRemoteMessage: socket.handleRemoteMessage,
    loadBoardData: socket.loadExistingBoardData,
    handleRemoteClear: socket.handleRemoteClear,
    syncCanvas: socket.syncCanvasState
  }));

  return (
    <div className={`relative w-full h-screen bg-gray-100 overflow-hidden ${className}`}>
      {/* Infinite Canvas */}
      <div
        ref={whiteboard.containerRef}
        className="absolute inset-0 bg-white"
        style={{
          backgroundImage: whiteboard.state.showGrid
            ? `radial-gradient(circle, #d1d5db 1px, transparent 1px)`
            : 'none',
          backgroundSize: whiteboard.state.showGrid ? '20px 20px' : 'none',
          backgroundPosition: `${whiteboard.state.pan.x}px ${whiteboard.state.pan.y}px`,
        }}
      >
        <canvas
          ref={whiteboard.canvasRef}
          className="absolute inset-0"
          style={{ cursor: whiteboard.getCursor() }}
        />
        
        {/* Remote cursors overlay */}
        <RemoteCursors 
          cursors={socket.remoteCursors.current}
          containerRef={whiteboard.containerRef}
        />
      </div>

      {/* UI Components */}
      <Toolbar
        state={whiteboard.state}
        onStateChange={whiteboard.handleStateChange}
        onClear={whiteboard.clearCanvas}
        onExport={whiteboard.exportCanvas}
        onResetView={whiteboard.fitToScreen}
      />

      <CanvasControls
        zoom={whiteboard.state.zoom}
        onZoomIn={whiteboard.handleZoomIn}
        onZoomOut={whiteboard.handleZoomOut}
        onFitToScreen={whiteboard.fitToScreen}
      />
    </div>
  );
});

MiroWhiteboard.displayName = 'MiroWhiteboard';

export default MiroWhiteboard;