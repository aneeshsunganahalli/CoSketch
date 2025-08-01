'use client';

import React from 'react';

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  showGrid,
  onToggleGrid,
}) => {
  return (
    <div className="absolute bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
        <div className="flex flex-col space-y-2">
          {/* Zoom Controls */}
          <button
            onClick={onZoomIn}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 text-black transition-all flex items-center justify-center font-bold text-lg"
            title="Zoom In"
          >
            +
          </button>
          
          <div className="w-full h-px bg-gray-200" />
          
          <button
            onClick={onFitToScreen}
            className="px-2 py-1 text-xs text-black font-medium hover:bg-gray-100 rounded-lg transition-all min-w-12 text-center"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <div className="w-full h-px bg-gray-200" />
          
          <button
            onClick={onZoomOut}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 text-black transition-all flex items-center justify-center font-bold text-lg"
            title="Zoom Out"
          >
            −
          </button>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200" />

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
              showGrid
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-black'
            }`}
            title="Toggle Grid"
          >
            <span className="text-sm">⊞</span>
          </button>
        </div>
      </div>
    </div>
  );
};
