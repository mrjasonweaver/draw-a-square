export interface Coordinates {
  x: number;
  y: number;
}
export interface MouseEvent extends Event {
  clientX: number;
  clientY: number;
  type: string;
}
export interface DragDirection {
  dragLeft: boolean;
  dragUp: boolean;
}