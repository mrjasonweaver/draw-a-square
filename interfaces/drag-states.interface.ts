import { Coordinates, DragDirection } from './drag-events.interface';

export interface SquaresState {
  coordinates: Coordinates;
  dragging: boolean;
  startPoint: Coordinates;
  endPoint: Coordinates;
  dragType: string;
  dragDirection: DragDirection;
  squareCount: number;
}
export interface SvgSelectorConfig {
  svgUrl: string;
  boundingBoxSelector: string;
  squareSelector: string;
  textNodeDimensionsSelector: string;
}