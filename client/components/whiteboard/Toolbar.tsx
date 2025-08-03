'use client';

import React, { useState } from 'react';
import { 
  MousePointer2, 
  Pen, 
  Highlighter, 
  Eraser, 
  Type, 
  Undo2,
  Redo2,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TOOLS, COLORS, BRUSH_SIZES } from './constants';
import { WhiteboardState } from './types';

// Icon mapping for dynamic rendering
const iconMap = {
  MousePointer2,
  Pen,
  Highlighter,
  Eraser,
  Type,
};

interface ToolbarProps {
  state: WhiteboardState;
  onStateChange: (updates: Partial<WhiteboardState>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onResetView: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  state,
  onStateChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onResetView,
}) => {
  const [isColorExpanded, setIsColorExpanded] = useState(false);
  
  // Popular colors for the compact view
  const popularColors = COLORS.slice(0, 8);
  
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
        <div className="flex items-center space-x-2">
          {/* Tool Selection */}
          <div className="flex items-center bg-gray-50 rounded-xl p-1">
            {TOOLS.map((tool) => {
              const IconComponent = iconMap[tool.icon as keyof typeof iconMap];
              return (
                <button
                  key={tool.id}
                  onClick={() => onStateChange({ selectedTool: tool.id })}
                  className={`w-10 h-10 rounded-lg transition-all relative group flex items-center justify-center ${
                    state.selectedTool === tool.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={tool.name}
                >
                  {tool.id === 'text' ? (
                    <span className="text-base font-bold">T</span>
                  ) : IconComponent ? (
                    <IconComponent size={18} />
                  ) : (
                    <span className="text-base">{tool.icon}</span>
                  )}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {tool.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-black font-medium">Size</span>
            <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1">
              {BRUSH_SIZES.slice(0, 4).map((size) => (
                <button
                  key={size}
                  onClick={() => onStateChange({ brushSize: size })}
                  className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                    state.brushSize === size
                      ? 'bg-blue-500'
                      : 'hover:bg-gray-200'
                  }`}
                  title={`${size}px`}
                >
                  <div
                    className={`rounded-full ${
                      state.brushSize === size ? 'bg-white' : 'bg-gray-600'
                    }`}
                    style={{
                      width: Math.max(3, Math.min(size / 2, 10)),
                      height: Math.max(3, Math.min(size / 2, 10)),
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Color Palette */}
          <div className="flex items-center space-x-2 relative">
            <span className="text-sm text-black font-medium">Color</span>
            <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1">
              {/* Compact Color View */}
              <div className="flex items-center space-x-1">
                {popularColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onStateChange({ brushColor: color })}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      state.brushColor === color
                        ? 'border-blue-500 scale-110 shadow-md'
                        : 'border-gray-200 hover:scale-105'
                    } ${color === '#FFFFFF' ? 'shadow-inner' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setIsColorExpanded(!isColorExpanded)}
                  className="w-7 h-7 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all flex items-center justify-center"
                  title={isColorExpanded ? "Show Less Colors" : "Show More Colors"}
                >
                  {isColorExpanded ? (
                    <ChevronUp size={14} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Color Palette */}
            {isColorExpanded && (
              <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 min-w-80">
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onStateChange({ brushColor: color });
                        setIsColorExpanded(false);
                      }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        state.brushColor === color
                          ? 'border-blue-500 scale-110 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${color === '#FFFFFF' ? 'shadow-inner' : ''}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onUndo}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700 transition-all flex items-center justify-center"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onRedo}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700 transition-all flex items-center justify-center"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </button>
            <button
              onClick={onClear}
              className="w-10 h-10 rounded-lg hover:bg-red-50 text-red-600 transition-all flex items-center justify-center"
              title="Clear All"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* View Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onResetView}
              className="px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-lg transition-all font-medium"
              title="Reset View"
            >
              {Math.round(state.zoom * 100)}%
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all shadow-md flex items-center space-x-2"
              title="Export"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
