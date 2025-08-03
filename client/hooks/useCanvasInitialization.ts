'use client';

import { useEffect } from 'react';
import { Canvas } from 'fabric';

export const useCanvasInitialization = (
  canvasRef: any,
  containerRef: any,
  fabricRef: any,
  state: any,
  setupCanvasEvents: any,
  updateToolSettings: any,
  handleMouseMove: any,
  socketService: any
) => {
  useEffect(() => {
    if (!canvasRef?.current || !containerRef?.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    fabricRef.current = new Canvas(canvasRef.current, {
      width: rect.width,
      height: rect.height,
      backgroundColor: '#ffffff',
      selection: state.selectedTool === 'select',
      preserveObjectStacking: true,
    });

    setupCanvasEvents();
    updateToolSettings();

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

  useEffect(() => {
    updateToolSettings();
    setupCanvasEvents();
  }, [state.selectedTool, state.brushColor, state.brushSize, setupCanvasEvents, updateToolSettings]);

  useEffect(() => {
    if (!containerRef?.current || !socketService) return;
    
    const container = containerRef.current;
    const mouseHandler = (e: MouseEvent) => handleMouseMove(e, state);
    container.addEventListener('mousemove', mouseHandler);
    
    return () => {
      container.removeEventListener('mousemove', mouseHandler);
    };
  }, [handleMouseMove, socketService, state, containerRef]);
};
