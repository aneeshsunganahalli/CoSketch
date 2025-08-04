'use client';

import { useCallback, useEffect } from 'react';
import { Canvas, FabricObject, Point } from 'fabric';

export const useCanvasEvents = (
  fabricRef: any,
  state: any,
  setState: any,
  isDragging: boolean,
  setIsDragging: any,
  lastPanPoint: any,
  setLastPanPoint: any,
  isUpdatingFromHistory: boolean,
  socketService: any,
  addText: any
) => {
  const eraseAtPoint = useCallback((pointer: Point, shouldBroadcast: boolean = true) => {
    if (!fabricRef?.current) return;

    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    const objectsToRemove: FabricObject[] = [];

    objects.forEach((obj: FabricObject) => {
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

    if (objectsToRemove.length > 0) {
      // Broadcast erase action if requested and not updating from history
      if (shouldBroadcast && socketService && !isUpdatingFromHistory) {
        objectsToRemove.forEach(obj => {
          const objectData = obj.toObject(['customId']);
          socketService.emitBroadcast({
            tool: 'eraser',
            type: 'erase',
            data: objectData,
            x: pointer.x,
            y: pointer.y,
            size: state.brushSize
          });
        });
      }

      objectsToRemove.forEach(obj => canvas.remove(obj));
      canvas.renderAll();
    }
  }, [fabricRef, state.brushSize, socketService, isUpdatingFromHistory]);

  const addShapeAtPoint = useCallback((pointer: Point) => {
    switch (state.selectedTool) {
      case 'text':
        addText(pointer);
        break;
    }
  }, [state.selectedTool, addText]);

  const setupCanvasEvents = useCallback(() => {
    if (!fabricRef?.current) return;

    const canvas = fabricRef.current;
    canvas.off();

    let isErasing = false;

    canvas.on('mouse:down', (e: any) => {
      const pointer = canvas.getPointer(e.e);
      const isSpacePressed = (e.e as MouseEvent).button === 1;
      const isShiftPressed = (e.e as MouseEvent).shiftKey;

      if (isSpacePressed || isShiftPressed) {
        setIsDragging(true);
        setState((prev: any) => ({ ...prev, isPanning: true }));
        setLastPanPoint({ x: (e.e as MouseEvent).clientX, y: (e.e as MouseEvent).clientY });
        canvas.selection = false;
        return;
      }

      switch (state.selectedTool) {
        case 'select':
          break;
        case 'eraser':
          isErasing = true;
          eraseAtPoint(pointer);
          break;
        case 'pen':
        case 'marker':
          break;
        default:
          addShapeAtPoint(pointer);
          break;
      }
    });

    canvas.on('mouse:move', (e: any) => {
      const pointer = canvas.getPointer(e.e);

      if (isDragging && state.isPanning) {
        const deltaX = (e.e as MouseEvent).clientX - lastPanPoint.x;
        const deltaY = (e.e as MouseEvent).clientY - lastPanPoint.y;

        canvas.relativePan(new Point(deltaX, deltaY));
        setLastPanPoint({ x: (e.e as MouseEvent).clientX, y: (e.e as MouseEvent).clientY });

        const vpt = canvas.viewportTransform;
        if (vpt) {
          setState((prev: any) => ({ ...prev, pan: { x: vpt[4], y: vpt[5] } }));
        }
      } else if (isErasing && state.selectedTool === 'eraser') {
        eraseAtPoint(pointer);
      }
    });

    canvas.on('mouse:up', () => {
      isErasing = false;
      setIsDragging(false);
      setState((prev: any) => ({ ...prev, isPanning: false }));
      canvas.selection = state.selectedTool === 'select';
    });

    canvas.on('mouse:wheel', (opt: any) => {
      const delta = (opt.e as WheelEvent).deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;

      if (zoom > 3) zoom = 3;
      if (zoom < 0.1) zoom = 0.1;

      const point = new Point((opt.e as WheelEvent).offsetX, (opt.e as WheelEvent).offsetY);
      canvas.zoomToPoint(point, zoom);
      setState((prev: any) => ({ ...prev, zoom }));

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    const broadcastCanvasEvent = (eventType: string, data?: any) => {
      if (!socketService || isUpdatingFromHistory) return;
      
      socketService.emitBroadcast({
        tool: 'Canvas',
        type: eventType,
        data: data
      });
    };

    canvas.on('path:created', (e: any) => {
      if (!isUpdatingFromHistory) {
        if (socketService && e.path) {
          // Add a unique identifier to the path for better tracking
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          e.path.set('customId', uniqueId);
          
          const pathData = e.path.toObject(['customId']);
          console.log('Broadcasting path creation:', pathData);
          socketService.emitBroadcast({
            tool: state.selectedTool === 'marker' ? 'marker' : 'pen',
            type: 'draw',
            data: pathData
          });
        }
      }
    });

    canvas.on('object:added', (e: any) => {
      if (!isUpdatingFromHistory) {
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

    canvas.on('object:removed', (e: any) => {
      if (!isUpdatingFromHistory) {
        broadcastCanvasEvent('remove', e.target?.toObject());
      }
    });

    canvas.on('object:modified', (e: any) => {
      if (!isUpdatingFromHistory) {
        broadcastCanvasEvent('modify', e.target?.toObject());
      }
    });

  }, [
    fabricRef,
    state.selectedTool,
    state.isPanning,
    state.brushSize,
    isDragging,
    lastPanPoint,
    isUpdatingFromHistory,
    socketService,
    setState,
    setIsDragging,
    setLastPanPoint,
    eraseAtPoint,
    addShapeAtPoint
  ]);

  return {
    setupCanvasEvents,
    eraseAtPoint,
  };
};
