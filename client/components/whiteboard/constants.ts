import { Tool } from './types';

export const TOOLS: Tool[] = [
  { id: 'select', name: 'Select', icon: 'MousePointer2', cursor: 'default' },
  { id: 'pen', name: 'Pen', icon: 'Pen', cursor: 'crosshair' },
  { id: 'marker', name: 'Marker', icon: 'Highlighter', cursor: 'crosshair' },
  { id: 'eraser', name: 'Eraser', icon: 'Eraser', cursor: 'crosshair' },
  { id: 'text', name: 'Text', icon: 'Type', cursor: 'text' },
];

export const COLORS = [
  // Black & Grays
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
  
  // Reds
  '#DC2626', '#EF4444', '#F87171', '#FCA5A5',
  
  // Oranges
  '#EA580C', '#F97316', '#FB923C', '#FDBA74',
  
  // Yellows
  '#D97706', '#F59E0B', '#FBBF24', '#FDE047',
  
  // Greens
  '#16A34A', '#22C55E', '#4ADE80', '#86EFAC',
  
  // Blues
  '#0891B2', '#06B6D4', '#2563EB', '#3B82F6', '#60A5FA',
  
  // Purples
  '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD',
  
  // Pinks
  '#DB2777', '#EC4899', '#F472B6', '#F9A8D4',
  
  // White
  '#FFFFFF'
];

export const BRUSH_SIZES = [2, 4, 6, 8, 12, 16, 24, 32];
