'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, PencilBrush, Rect, FabricObject, Point, Textbox, Path, util } from 'fabric';
import { Toolbar } from './whiteboard/Toolbar';
import { CanvasControls } from './whiteboard/CanvasControls';
import { WhiteboardState } from './whiteboard/types';
import { BroadcastMessage, CursorMoveEvent } from '@/types/socket.types';
import RemoteCursors from './whiteboard/RemoteCursors';

interface WhiteboardProps {
  className?: string;
  roomId?: string;
  socketService?: {
    emitBroadcast: (message: BroadcastMessage) => void;
    emitCursorMove: (x: number, y: number, color?: string, size?: number, tool?: string) => void;
    emitClearCanvas: () => void;
  };
}

interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
  lastSeen: number;
}

const MiroWhiteboard = forwardRef<any, WhiteboardProps>(({ className = '', roomId, socketService }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCursorUpdate = useRef<number>(0);
  const remoteCursors = useRef<Map<string, RemoteCursor>>(new Map());
  const [, setRemoteCursorsUpdate] = useState(0); // Force re-render for cursor updates

  // Miro-like state management
  const [state, setState] = useState<WhiteboardState>({
    selectedTool: 'pen',
    brushColor: '#000000',
    brushSize: 4,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isPanning: false,
    showGrid: true,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleRemoteMessage: (message: BroadcastMessage) => {
      if (message.tool === 'Cursor') {
        handleRemoteCursor(message);
      } else if (message.tool === 'CanvasSync' && message.type === 'fullState') {
        handleCanvasStateRestore(message.data);
      } else {
        handleRemoteDrawing(message);
      }
    },
    loadBoardData: (boardData: any[]) => {
      loadExistingBoardData(boardData);
    },
    handleRemoteClear: () => {
      if (fabricRef.current) {
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
        fabricRef.current.renderAll();
      }
    },
    syncCanvas: () => {
      syncCanvasState();
    }
  }));

  // Handle remote cursor movements
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
    setRemoteCursorsUpdate(prev => prev + 1); // Force re-render
  }, []);

  // Handle remote drawing events
  const handleRemoteDrawing = useCallback((message: BroadcastMessage) => {
    if (!fabricRef.current || isUpdatingFromHistory) return;
    
    console.log('Received remote drawing message:', message);
    
    const canvas = fabricRef.current;
    
    // Temporarily set flag to prevent re-broadcasting
    setIsUpdatingFromHistory(true);
    
    try {
      // Handle paths (the most common drawing type)
      if ((message.tool === 'pen' || message.tool === 'marker') && message.data) {
        console.log('Creating path from remote data:', message.data);
        
        // Use Path.fromObject with proper async handling
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
      // Reset flag after a short delay
      setTimeout(() => {
        setIsUpdatingFromHistory(false);
      }, 100);
    }
  }, [isUpdatingFromHistory]);

  // Enhanced canvas state sync for new users
  const syncCanvasState = useCallback(() => {
    if (!fabricRef.current || !socketService || isUpdatingFromHistory) return;
    
    try {
      const canvas = fabricRef.current;
      const canvasState = canvas.toJSON();
      const stateString = JSON.stringify(canvasState);
      
      // Emit the entire canvas state
      socketService.emitBroadcast({
        tool: 'CanvasSync',
        type: 'fullState',
        data: canvasState
      });
      
      console.log('Synced canvas state for new users');
    } catch (error) {
      console.error('Error syncing canvas state:', error);
    }
  }, [socketService, isUpdatingFromHistory]);

  // Handle canvas state restoration
  const handleCanvasStateRestore = useCallback((canvasState: any) => {
    if (!fabricRef.current || isUpdatingFromHistory) return;
    
    console.log('Restoring canvas state:', canvasState);
    
    const canvas = fabricRef.current;
    setIsUpdatingFromHistory(true);
    
    try {
      canvas.loadFromJSON(canvasState, () => {
        canvas.renderAll();
        console.log('Canvas state restored successfully');
        
        setTimeout(() => {
          setIsUpdatingFromHistory(false);
        }, 100);
      });
    } catch (error) {
      console.error('Error restoring canvas state:', error);
      setIsUpdatingFromHistory(false);
    }
  }, []);
  const loadExistingBoardData = useCallback((boardData: any[]) => {
    if (!fabricRef.current || !boardData.length) return;
    
    console.log('Loading existing board data:', boardData);
    
    const canvas = fabricRef.current;
    
    // Set flag to prevent re-broadcasting during load
    setIsUpdatingFromHistory(true);
    
    try {
      // Process each drawing operation from the board data
      boardData.forEach((message, index) => {
        setTimeout(() => {
          if (!fabricRef.current) return;
          
          // Handle different types of drawing messages
          if (message.tool === 'pen' || message.tool === 'marker') {
            if (message.data) {
              console.log(`Loading drawing ${index + 1}/${boardData.length}:`, message.data);
              
              // Create path from stored data
              Path.fromObject(message.data).then((path) => {
                if (path && fabricRef.current) {
                  fabricRef.current.add(path);
                  fabricRef.current.renderAll();
                }
              }).catch((error) => {
                console.error('Error loading path:', error);
              });
            }
          }
          // Handle other drawing types here if needed
          
          // Reset flag after loading the last item
          if (index === boardData.length - 1) {
            setTimeout(() => {
              setIsUpdatingFromHistory(false);
            }, 200);
          }
        }, index * 10); // Small delay between each drawing to prevent overwhelming
      });
    } catch (error) {
      console.error('Error loading board data:', error);
      setIsUpdatingFromHistory(false);
    }
  }, []);

  // Enhanced cursor tracking with socket emission
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!fabricRef.current || !socketService) return;
    
    const canvas = fabricRef.current;
    const rect = canvas.getElement().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const now = Date.now();
    const CURSOR_UPDATE_THROTTLE = 50; // 20fps for cursor updates
    
    if (now - lastCursorUpdate.current > CURSOR_UPDATE_THROTTLE) {
      socketService.emitCursorMove(x, y, state.brushColor, state.brushSize, state.selectedTool);
      lastCursorUpdate.current = now;
      
      // Also emit as broadcast message for whitebophir compatibility
      socketService.emitBroadcast({
        tool: 'Cursor',
        type: 'update',
        x,
        y,
        color: state.brushColor,
        size: state.brushSize
      });
    }
  }, [socketService, state.brushColor, state.brushSize, state.selectedTool]);

  // Add mouse move listener for cursor tracking
  useEffect(() => {
    if (!containerRef.current || !socketService) return;
    
    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, socketService]);
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Create large virtual canvas
    fabricRef.current = new Canvas(canvasRef.current, {
      width: rect.width,
      height: rect.height,
      backgroundColor: '#ffffff',
      selection: state.selectedTool === 'select',
      preserveObjectStacking: true,
    });

    setupCanvasEvents();
    updateToolSettings();

    // Handle window resize
    const handleResize = () => {
      if (fabricRef.current && containerRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        fabricRef.current.setDimensions({
          width: newRect.width,
          height: newRect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      fabricRef.current?.dispose();
    };
  }, []);

  // Update tool settings when state changes
  useEffect(() => {
    updateToolSettings();
    // Re-setup events when tool changes to ensure handlers have current state
    setupCanvasEvents();
  }, [state.selectedTool, state.brushColor, state.brushSize]);

  // Unified helper functions
  const eraseAtPoint = (pointer: Point) => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    const objectsToRemove: FabricObject[] = [];

    objects.forEach((obj) => {
      if (obj.containsPoint && obj.containsPoint(pointer)) {
        objectsToRemove.push(obj);
      } else {
        const objBounds = obj.getBoundingRect();
        const distance = Math.sqrt(
          Math.pow(pointer.x - (objBounds.left + objBounds.width / 2), 2) +
          Math.pow(pointer.y - (objBounds.top + objBounds.height / 2), 2)
        );
        if (distance < state.brushSize * 2) {
          objectsToRemove.push(obj);
        }
      }
    });

    objectsToRemove.forEach(obj => canvas.remove(obj));
    if (objectsToRemove.length > 0) {
      canvas.renderAll();
    }
  };

  const setupCanvasEvents = useCallback(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;

    // Remove ALL event listeners to prevent conflicts
    canvas.off();

    let isErasing = false;

    // Single unified mouse down handler
    canvas.on('mouse:down', (e) => {
      const pointer = canvas.getPointer(e.e);
      const isSpacePressed = (e.e as MouseEvent).button === 1;
      const isShiftPressed = (e.e as MouseEvent).shiftKey;

      // Priority 1: Panning (space or shift key)
      if (isSpacePressed || isShiftPressed) {
        setIsDragging(true);
        setState(prev => ({ ...prev, isPanning: true }));
        setLastPanPoint({ x: (e.e as MouseEvent).clientX, y: (e.e as MouseEvent).clientY });
        canvas.selection = false;
        return;
      }

      // Priority 2: Tool-specific actions
      switch (state.selectedTool) {
        case 'select':
          // Let Fabric.js handle selection
          break;
        case 'eraser':
          isErasing = true;
          eraseAtPoint(pointer);
          break;
        case 'pen':
        case 'marker':
          // Drawing mode is handled by Fabric.js
          break;
        default:
          // Shape tools
          addShapeAtPoint(pointer);
          break;
      }
    });

    // Single unified mouse move handler
    canvas.on('mouse:move', (e) => {
      const pointer = canvas.getPointer(e.e);

      if (isDragging && state.isPanning) {
        const deltaX = (e.e as MouseEvent).clientX - lastPanPoint.x;
        const deltaY = (e.e as MouseEvent).clientY - lastPanPoint.y;

        canvas.relativePan(new Point(deltaX, deltaY));
        setLastPanPoint({ x: (e.e as MouseEvent).clientX, y: (e.e as MouseEvent).clientY });

        const vpt = canvas.viewportTransform;
        if (vpt) {
          setState(prev => ({ ...prev, pan: { x: vpt[4], y: vpt[5] } }));
        }
      } else if (isErasing && state.selectedTool === 'eraser') {
        eraseAtPoint(pointer);
      }
    });

    // Single unified mouse up handler
    canvas.on('mouse:up', () => {
      isErasing = false;
      setIsDragging(false);
      setState(prev => ({ ...prev, isPanning: false }));
      canvas.selection = state.selectedTool === 'select';
    });

    // Zoom handler
    canvas.on('mouse:wheel', (opt) => {
      const delta = (opt.e as WheelEvent).deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;

      if (zoom > 3) zoom = 3;
      if (zoom < 0.1) zoom = 0.1;

      const point = new Point((opt.e as WheelEvent).offsetX, (opt.e as WheelEvent).offsetY);
      canvas.zoomToPoint(point, zoom);
      setState(prev => ({ ...prev, zoom }));

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Canvas event broadcasting
    const debouncedSaveHistory = () => {
      if (isUpdatingFromHistory) return;
      // History functionality removed - no longer saving state
    };

    const broadcastCanvasEvent = (eventType: string, data?: any) => {
      if (!socketService || isUpdatingFromHistory) return;
      
      socketService.emitBroadcast({
        tool: 'Canvas',
        type: eventType,
        data: data
      });
    };

    // History events - only save when not updating from history
    canvas.on('path:created', (e) => {
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
        
        // Broadcast path creation for real-time collaboration
        if (socketService && e.path) {
          const pathData = e.path.toObject();
          console.log('Broadcasting path creation:', pathData);
          socketService.emitBroadcast({
            tool: state.selectedTool === 'marker' ? 'marker' : 'pen',
            type: 'draw',
            data: pathData
          });
        }
      }
    });

    canvas.on('object:added', (e) => {
      // Only save if this wasn't triggered by loadFromJSON
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
        
        // Broadcast object addition
        if (socketService && e.target) {
          const objectData = e.target.toObject();
          socketService.emitBroadcast({
            tool: state.selectedTool,
            type: 'add',
            data: objectData
          });
        }
      }
    });

    canvas.on('object:removed', (e) => {
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
        broadcastCanvasEvent('remove', e.target?.toObject());
      }
    });

    canvas.on('object:modified', (e) => {
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
        broadcastCanvasEvent('modify', e.target?.toObject());
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, [state.selectedTool, state.isPanning, isDragging, isUpdatingFromHistory]);

  const addShapeAtPoint = (pointer: Point) => {
    switch (state.selectedTool) {
      case 'text':
        addText(pointer);
        break;
    }
  };

  const updateToolSettings = () => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;

    switch (state.selectedTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;

      case 'pen':
      case 'marker':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        const brush = new PencilBrush(canvas);
        brush.color = state.brushColor;
        brush.width = state.brushSize;
        if (state.selectedTool === 'marker') {
          brush.color = state.brushColor + '80'; // Add transparency for marker
        }
        canvas.freeDrawingBrush = brush;
        break;

      case 'eraser':
        canvas.isDrawingMode = false;
        canvas.selection = false;
        // Eraser is now handled directly in unified mouse events
        break;

      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
  };

  const addText = (pointer: Point) => {
    if (!fabricRef.current) return;

    const text = new Textbox('Type here...', {
      left: pointer.x,
      top: pointer.y,
      fontSize: 16,
      fill: '#000000', // Always black text for readability
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 400,
      width: 200,
      backgroundColor: 'transparent',
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    text.enterEditing();
    // saveHistory will be called by the event listener
  };

  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';
    
    // Emit socket event for real-time collaboration
    if (socketService) {
      socketService.emitClearCanvas();
    }
  }, [socketService]);

  const exportCanvas = () => {
    if (!fabricRef.current) return;

    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `miro-board-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    if (!fabricRef.current) return;
    const currentZoom = fabricRef.current.getZoom();
    const newZoom = Math.min(currentZoom * 1.2, 3);
    fabricRef.current.setZoom(newZoom);
    setState(prev => ({ ...prev, zoom: newZoom }));
  };

  const handleZoomOut = () => {
    if (!fabricRef.current) return;
    const currentZoom = fabricRef.current.getZoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.1);
    fabricRef.current.setZoom(newZoom);
    setState(prev => ({ ...prev, zoom: newZoom }));
  };

  const fitToScreen = () => {
    if (!fabricRef.current) return;
    fabricRef.current.setZoom(1);
    fabricRef.current.absolutePan(new Point(0, 0));
    setState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  };

  const toggleGrid = () => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  };

  const handleStateChange = (updates: Partial<WhiteboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const getCursor = () => {
    if (state.isPanning) return 'grabbing';
    if (state.selectedTool === 'text') return 'text';
    if (['pen', 'marker', 'eraser'].includes(state.selectedTool)) return 'crosshair';
    return 'default';
  };

  return (
    <div className={`relative w-full h-screen bg-gray-100 overflow-hidden ${className}`}>
      {/* Infinite Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 bg-white"
        style={{
          backgroundImage: state.showGrid
            ? `radial-gradient(circle, #d1d5db 1px, transparent 1px)`
            : 'none',
          backgroundSize: state.showGrid ? '20px 20px' : 'none',
          backgroundPosition: `${state.pan.x}px ${state.pan.y}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: getCursor() }}
        />
        
        {/* Remote cursors overlay */}
        <RemoteCursors 
          cursors={remoteCursors.current}
          containerRef={containerRef}
        />
      </div>

      {/* Miro-like UI Components */}
      <Toolbar
        state={state}
        onStateChange={handleStateChange}
        onClear={clearCanvas}
        onExport={exportCanvas}
        onResetView={fitToScreen}
      />

      <CanvasControls
        zoom={state.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={fitToScreen}
        showGrid={state.showGrid}
        onToggleGrid={toggleGrid}
      />
    </div>
  );
});

MiroWhiteboard.displayName = 'MiroWhiteboard';

export default MiroWhiteboard;