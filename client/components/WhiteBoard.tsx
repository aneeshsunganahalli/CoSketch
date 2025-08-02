'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, PencilBrush, Rect, FabricObject, Point, Textbox } from 'fabric';
import { Toolbar } from './whiteboard/Toolbar';
import { CanvasControls } from './whiteboard/CanvasControls';
import { WhiteboardState } from './whiteboard/types';

interface WhiteboardProps {
  className?: string;
}

const MiroWhiteboard: React.FC<WhiteboardProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

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

  // Initialize canvas with Miro-like infinite canvas
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
    saveHistory();

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

  // Updated history management with better state handling
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isUpdatingFromHistory) return;

    try {
      const canvas = fabricRef.current;

      // Ensure canvas has white background before saving
      canvas.backgroundColor = '#ffffff';

      // Get canvas state with all objects
      const canvasState = canvas.toJSON();
      canvasState.backgroundColor = '#ffffff';

      const stateString = JSON.stringify(canvasState);

      // Don't save duplicate states
      if (historyRef.current.length > 0 &&
        historyRef.current[historyIndexRef.current] === stateString) {
        return;
      }

      // Remove future history if we're not at the end
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }

      // Add new state
      historyRef.current.push(stateString);
      historyIndexRef.current = historyRef.current.length - 1;

      // Keep only last 30 states to prevent memory issues
      if (historyRef.current.length > 30) {
        historyRef.current = historyRef.current.slice(-30);
        historyIndexRef.current = historyRef.current.length - 1;
      }
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, [isUpdatingFromHistory]);

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

    // Updated history saving with debounce
    let saveTimeout: NodeJS.Timeout;

    const debouncedSaveHistory = () => {
      if (isUpdatingFromHistory) return;

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveHistory();
      }, 300); // Longer debounce to prevent excessive saves
    };

    // History events - only save when not updating from history
    canvas.on('path:created', debouncedSaveHistory);
    canvas.on('object:added', (e) => {
      // Only save if this wasn't triggered by loadFromJSON
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
      }
    });
    canvas.on('object:removed', (e) => {
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
      }
    });
    canvas.on('object:modified', (e) => {
      if (!isUpdatingFromHistory) {
        debouncedSaveHistory();
      }
    });

    return () => {
      clearTimeout(saveTimeout);
    };
  }, [state.selectedTool, state.isPanning, isDragging, isUpdatingFromHistory, saveHistory]);

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

  const undo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current <= 0) return;

    const canvas = fabricRef.current;
    setIsUpdatingFromHistory(true);

    try {
      historyIndexRef.current--;
      const previousState = historyRef.current[historyIndexRef.current];
      const stateObj = JSON.parse(previousState);

      // Clear canvas first
      canvas.clear();

      // Set background
      canvas.backgroundColor = '#ffffff';

      // Load the state synchronously if possible
      canvas.loadFromJSON(stateObj, () => {
        // Force immediate render
        canvas.renderAll();

        // Small delay to ensure everything is rendered
        requestAnimationFrame(() => {
          if (fabricRef.current) {
            fabricRef.current.renderAll();
            setIsUpdatingFromHistory(false);
          }
        });
      });

    } catch (error) {
      console.error('Error during undo:', error);
      setIsUpdatingFromHistory(false);
    }
  }, []);

  const redo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

    const canvas = fabricRef.current;
    setIsUpdatingFromHistory(true);

    try {
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      const stateObj = JSON.parse(nextState);

      // Clear canvas first
      canvas.clear();

      // Set background
      canvas.backgroundColor = '#ffffff';

      // Load the state
      canvas.loadFromJSON(stateObj, () => {
        // Force immediate render
        canvas.renderAll();

        // Small delay to ensure everything is rendered
        requestAnimationFrame(() => {
          if (fabricRef.current) {
            fabricRef.current.renderAll();
            setIsUpdatingFromHistory(false);
          }
        });
      });

    } catch (error) {
      console.error('Error during redo:', error);
      setIsUpdatingFromHistory(false);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';
    saveHistory();
  }, [saveHistory]);

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
      </div>

      {/* Miro-like UI Components */}
      <Toolbar
        state={state}
        onStateChange={handleStateChange}
        onUndo={undo}
        onRedo={redo}
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
};

export default MiroWhiteboard;