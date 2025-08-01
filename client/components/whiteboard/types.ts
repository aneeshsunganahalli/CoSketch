export interface Tool {
  id: string;
  name: string;
  icon: string;
  cursor?: string;
}

export interface WhiteboardState {
  selectedTool: string;
  brushColor: string;
  brushSize: number;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  showGrid: boolean;
}
