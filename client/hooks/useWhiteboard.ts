'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas, PencilBrush, Point, Textbox } from 'fabric';
import { WhiteboardState } from '@/components/whiteboard/types';

export const useWhiteboard = (socketService?: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleStateChange = useCallback((updates: Partial<WhiteboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!fabricRef.current) return;
    const currentZoom = fabricRef.current.getZoom();
    const newZoom = Math.min(currentZoom * 1.2, 3);
    fabricRef.current.setZoom(newZoom);
    setState(prev => ({ ...prev, zoom: newZoom }));
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!fabricRef.current) return;
    const currentZoom = fabricRef.current.getZoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.1);
    fabricRef.current.setZoom(newZoom);
    setState(prev => ({ ...prev, zoom: newZoom }));
  }, []);

  const fitToScreen = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setZoom(1);
    fabricRef.current.absolutePan(new Point(0, 0));
    setState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';
    
    if (socketService) {
      socketService.emitClearCanvas();
    }
  }, [socketService]);

  const exportCanvas = useCallback(() => {
    if (!fabricRef.current) return;

    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const addText = useCallback((pointer: Point) => {
    if (!fabricRef.current) return;

    const text = new Textbox('Type here...', {
      left: pointer.x,
      top: pointer.y,
      fontSize: 16,
      fill: '#000000',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeight: 400,
      width: 200,
      backgroundColor: 'transparent',
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    text.enterEditing();
  }, []);

  const updateToolSettings = useCallback(() => {
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
          brush.color = state.brushColor + '80';
        }
        canvas.freeDrawingBrush = brush;
        break;

      case 'eraser':
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;

      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
  }, [state.selectedTool, state.brushColor, state.brushSize]);

  const getCursor = useCallback(() => {
    if (state.isPanning) return 'grabbing';
    if (state.selectedTool === 'text') return 'text';
    if (['pen', 'marker', 'eraser'].includes(state.selectedTool)) return 'crosshair';
    return 'default';
  }, [state.isPanning, state.selectedTool]);

  return {
    canvasRef,
    fabricRef,
    containerRef,
    state,
    setState,
    isDragging,
    setIsDragging,
    lastPanPoint,
    setLastPanPoint,
    isUpdatingFromHistory,
    setIsUpdatingFromHistory,
    handleStateChange,
    handleZoomIn,
    handleZoomOut,
    fitToScreen,
    clearCanvas,
    exportCanvas,
    addText,
    updateToolSettings,
    getCursor,
  };
};
