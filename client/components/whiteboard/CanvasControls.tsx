'use client';

import React from 'react';

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}) => {
  return (
    <div className="absolute bottom-6 right-6 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1">
        <div className="flex flex-col items-center">
          {/* Zoom In */}
          <button
            onClick={onZoomIn}
            className="w-10 h-10 rounded-lg hover:bg-gray-100/80 text-gray-700 transition-colors flex items-center justify-center text-lg font-medium"
            title="Zoom In"
          >
            +
          </button>
          
          {/* Zoom Percentage */}
          <button
            onClick={onFitToScreen}
            className="w-10 h-8 text-xs text-gray-600 font-medium hover:bg-gray-100/80 rounded-lg transition-colors flex items-center justify-center"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          {/* Zoom Out */}
          <button
            onClick={onZoomOut}
            className="w-10 h-10 rounded-lg hover:bg-gray-100/80 text-gray-700 transition-colors flex items-center justify-center text-lg font-medium"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};