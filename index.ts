import { fromEvent, Observable, BehaviorSubject, merge } from 'rxjs';
import { map } from 'rxjs/operators';

// Here's where we're defining data models and types
interface Coordinates {
  x: number;
  y: number;
}
interface MouseEvent extends Event {
  clientX: number;
  clientY: number;
  type: string;
}
interface DragDirection {
  dragLeft: boolean;
  dragUp: boolean;
}
interface SquaresState {
  coordinates: Coordinates;
  dragging: boolean;
  startPoint: Coordinates;
  endPoint: Coordinates;
  dragType: string;
  dragDirection: DragDirection;
  squareCount: number;
}
interface SvgSelectorConfig {
  svgUrl: string;
  boundingBoxSelector: string;
  squareSelector: string;
  textNodeDimensionsSelector: string;
}

// A few dom elements stored here
const main: HTMLElement = document.querySelector('#main'),
countEl: HTMLElement = document.querySelector('count'),
clearButton: HTMLElement = document.querySelector('#clear'),
undoButton: HTMLElement = document.querySelector('#undo');

let boundingBox;
let square;
let currentSquare;
let textNodeDimensions;
let currentTextNodeDimensions;

// We're organizing our initial & current state in an object
// with the same shape as our data model interface above
let currentSquaresState: SquaresState = {
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
const squaresState: BehaviorSubject<SquaresState> = new BehaviorSubject(
  currentSquaresState
);
const setState = (state: SquaresState): void => {
  return squaresState.next(getState(state));
}
const getState = (state: SquaresState): SquaresState => {
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
// Setting initial counter
countEl.innerHTML = `Squares: ${currentSquaresState.squareCount}`;

/**
 * Do things based on dragging state
 * @param state 
 */

const renderUi = (state: SquaresState): void => {
  const config: SvgSelectorConfig = {
    svgUrl: 'http://www.w3.org/2000/svg',
    boundingBoxSelector: `boundingBox-${state.squareCount + 1}`,
    squareSelector: `square-${state.squareCount + 1}`,
    textNodeDimensionsSelector: `text-width-${state.squareCount + 1}`
  }
  if (state.dragging && state.dragType === 'start') {
    initDraw(state, config);
  }
  if (state.dragging && state.dragType === 'drag') {
    drawSquare(state, config);
  }
  if (!state.dragging && state.dragType === 'cancel') {
    countEl.innerHTML = `Squares: ${currentSquaresState.squareCount}`;
  }
  renderButtonStates(state);
}

/**
 * Make some SVG elements and add to the DOM
 * @param state 
 * @param config 
 */
const initDraw = (state: SquaresState, config: SvgSelectorConfig): void => {
  const xPos = state.coordinates.x.toString();
  const yPos = state.coordinates.y.toString();
  boundingBox = document.createElementNS(config.svgUrl, 'g');
  boundingBox.setAttribute('id', config.boundingBoxSelector);
  boundingBox.setAttribute('x', xPos);
  boundingBox.setAttribute('y', yPos);
  square = document.createElementNS(config.svgUrl, 'rect');
  square.setAttribute('id', config.squareSelector);
  square.setAttribute('x', xPos);
  square.setAttribute('y', yPos);
  textNodeDimensions = document.createElementNS(config.svgUrl, 'text');
  textNodeDimensions.setAttribute('id', config.textNodeDimensionsSelector);
  textNodeDimensions.setAttribute('x', xPos);
  textNodeDimensions.setAttribute('y', yPos);
  boundingBox.appendChild(textNodeDimensions);
  boundingBox.appendChild(square);
  boundingBox.appendChild(textNodeDimensions);
  main.appendChild(boundingBox);
}

// Drawing the square
const drawSquare = (state: SquaresState, config: SvgSelectorConfig): void => {
  currentSquare = document.querySelector(`#${config.squareSelector}`);
  currentTextNodeDimensions = document.querySelector(`#${config.textNodeDimensionsSelector}`);
  const xPos = state.coordinates.x.toString();
  const yPos = state.coordinates.y.toString();
  const width = state.dragDirection.dragLeft
    ? state.startPoint.x - state.coordinates.x
    : state.coordinates.x - state.startPoint.x;
  const height = state.dragDirection.dragUp
    ? state.startPoint.y - state.coordinates.y
    : state.coordinates.y - state.startPoint.y;
  const widthStr = width.toString();
  const heightStr = height.toString();
  const dimensions = `${width} x ${height}`;
  currentSquare.setAttribute('width', widthStr);
  currentSquare.setAttribute('height', heightStr);
  currentTextNodeDimensions.innerHTML = dimensions;

  state.dragDirection.dragLeft
    ? currentSquare.setAttribute('x', xPos)
    : currentTextNodeDimensions.setAttribute('x', xPos);
  if (state.dragDirection.dragUp) {
    currentSquare.setAttribute('y', yPos);
    currentTextNodeDimensions.setAttribute('y', yPos);
  }
}

// Need to keep these buttons disabled
// if there are no items on the canvas
const renderButtonStates = (state: SquaresState): void => {
  if (!state.squareCount) {
    clearButton.setAttribute('disabled', '');
    undoButton.setAttribute('disabled', '');
  } else {
    clearButton.removeAttribute('disabled');
    undoButton.removeAttribute('disabled');
  }
}

// Here's some dom manipulation and state manaagement
// we need to do when the user clicks the undo and clear buttons
const undoLast = (): void => {
  const children = Array.from(main.childNodes);
  const undoSquare = children.filter((x, i) => i === (children.length - 1));
  main.removeChild(document.getElementById(undoSquare[0]['id']));
  setState({
    ...currentSquaresState,
    squareCount: currentSquaresState.squareCount - 1
  });
  countEl.innerHTML = `Squares: ${currentSquaresState.squareCount}`;
}
const clearSVG = () => {
  main.innerHTML = '';
  setState({
    ...currentSquaresState,
    squareCount: 0
  });
  countEl.innerHTML = `Squares: ${currentSquaresState.squareCount}`;
}

// We need to make event streams for undo and clear buttons
const clear$ = fromEvent(clearButton, "click");
const undo$ = fromEvent(undoButton, "click");

// In this section we are capturing mouse events, making
// observables, and transforming data stream emissions
// into our defined interface using the rxjs map operator 🤘
const mouseDown$: Observable<any> = fromEvent(main, "mousedown").pipe(
  map((e: MouseEvent) => ({
    clientX: e.clientX,
    clientY: e.clientY,
    type: "start"
  }))
);
const mouseMove$: Observable<any> = fromEvent(main, "mousemove").pipe(
  map((e: MouseEvent) => ({
    clientX: e.clientX,
    clientY: e.clientY,
    type: "drag"
  }))
);
const mouseUp$: Observable<any> = fromEvent(main, "mouseup").pipe(
  map((e: MouseEvent) => ({
    clientX: e.clientX,
    clientY: e.clientY,
    type: "cancel"
  }))
);
const mouseEventStream$: Observable<Object> = merge(
  mouseUp$, mouseDown$, mouseMove$
);

const gatherEventStream = (): void => {
  clear$.subscribe(() => clearSVG());
  undo$.subscribe(() => undoLast());
  squaresState.subscribe(state => {
    currentSquaresState = state;
    return renderUi(state);
  });
  mouseEventStream$.subscribe((state: MouseEvent): void => {
    if (state.type === 'start') {
      return setState({
        ...currentSquaresState,
        dragging: true,
        startPoint: { x: state.clientX, y: state.clientY },
        dragType: state.type
      });
    } else if (state.type === 'cancel') {
      return setState({
        ...currentSquaresState,
        dragging: false,
        endPoint: { x: state.clientX, y: state.clientY },
        dragType: state.type,
        squareCount: currentSquaresState.squareCount + 1
      });
    } else {
      return setState({
        ...currentSquaresState,
        coordinates: { x: state.clientX, y: state.clientY },
        dragType: state.type
      });
    }
  });
}

gatherEventStream();