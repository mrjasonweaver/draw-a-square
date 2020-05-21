import { BehaviorSubject } from 'rxjs';
import { SquaresState } from '../interfaces/drag-states.interface'

// We're organizing our initial & current state in an object
// with the same shape as our SquaresState data model
export const currentSquaresState: SquaresState = {
  coordinates: {
    x: 0,
    y: 0
  },
  dragging: false,
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 0, y: 0 },
  dragType: '',
  dragDirection: {
    dragLeft: false,
    dragUp: false
  },
  squareCount: 0
};

// A BehaviorSubject is used to store the current state.
// We call `.next()` on this to keep state updated 💥
export const squaresState: BehaviorSubject<SquaresState> = new BehaviorSubject(
  currentSquaresState
);
export const setState = (state: SquaresState): void => {
  return squaresState.next(getState(state));
}
export const getState = (state: SquaresState): SquaresState => {
  return {
    dragging: state.dragging,
    coordinates: {
      x: state.coordinates.x,
      y: state.coordinates.y
    },
    startPoint: { x: state.startPoint.x, y: state.startPoint.y },
    endPoint: { x: state.endPoint.x, y: state.endPoint.y },
    dragType: state.dragType,
    dragDirection: {
      dragLeft: state.startPoint.x > state.coordinates.x || false,
      dragUp: state.startPoint.y > state.coordinates.y || false
    },
    squareCount: state.squareCount
  };
}