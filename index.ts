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
interface SquaresState {
  coordinates: Coordinates;
  dragging: boolean;
  startPoint: Coordinates;
  endPoint: Coordinates;
  dragType: string;
  squareCount: number;
}

// A few dom elements stored here
const main: HTMLElement = document.querySelector('#main'),
countEl: HTMLElement = document.querySelector('count'),
clearButton: HTMLElement = document.querySelector('#clear'),
undoButton: HTMLElement = document.querySelector('#undo');

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
  squareCount: 0
};

// A BehaviorSubject is used to store the current state.
// We call `.next()` on this to keep state updated 💥
const squaresState: BehaviorSubject<SquaresState> = new BehaviorSubject(
  currentSquaresState
);
const setState = (state: SquaresState): void => {
  squaresState.next(getState(state));
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
    squareCount: state.squareCount
  };
}

// All things adding to the DOM
const renderUi = (state: SquaresState): void => {
  let square;
  let currentSquare;
  const squareSelector = `square-${state.squareCount + 1}`;
  const dragLeft = state.startPoint.x > state.coordinates.x;
  const dragUp = state.startPoint.y > state.coordinates.y;
  if (state.dragging === true) {
    if (state.dragType === 'start') {
      square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      square.setAttribute('id', squareSelector);
      square.setAttribute('x', state.coordinates.x);
      square.setAttribute('y', state.coordinates.y);
      main.appendChild(square);
    } else if (state.dragType === 'drag') {
      currentSquare = document.querySelector(`#${squareSelector}`);
      if (!dragUp && !dragLeft) {
        currentSquare.setAttribute('width', state.coordinates.x - state.startPoint.x);
        currentSquare.setAttribute('height', state.coordinates.y - state.startPoint.y);
      }
      if (dragUp && dragLeft) {
        currentSquare.setAttribute('x', state.coordinates.x);
        currentSquare.setAttribute('y', state.coordinates.y);
        currentSquare.setAttribute('width', state.startPoint.x - state.coordinates.x);
        currentSquare.setAttribute('height', state.startPoint.y - state.coordinates.y);     
      }
      if (!dragUp && dragLeft) {
        currentSquare.setAttribute('x', state.coordinates.x);
        currentSquare.setAttribute('width', state.startPoint.x - state.coordinates.x);
        currentSquare.setAttribute('height', state.coordinates.y - state.startPoint.y); 
      } 
      if (dragUp && !dragLeft) {
        currentSquare.setAttribute('y', state.coordinates.y);
        currentSquare.setAttribute('width', state.coordinates.x - state.startPoint.x);
        currentSquare.setAttribute('height', state.startPoint.y - state.coordinates.y);       
      }
    }
  } else {
    countEl.innerHTML = `Squares: ${currentSquaresState.squareCount}`;
  }
  renderButtonStates(state);
}

const renderButtonStates = (state: SquaresState): void => {
  if (!state.squareCount) {
    clearButton.setAttribute('disabled', 'disabled');
    undoButton.setAttribute('disabled', 'disabled');
  } else {
    clearButton.removeAttribute('disabled');
    undoButton.removeAttribute('disabled');
  }
}

// Here's some dom manipulation and state manaagement
// we need to do when the user clicks the undo and clear buttons
const undoLast = () => {
  const children = Array.from(main.childNodes);
  const undoSquare = children.filter((x, i) => i === (children.length - 1));
  main.removeChild(document.getElementById(undoSquare[0]['id']));
  setState({
    ...currentSquaresState,
    squareCount: currentSquaresState.squareCount - 1
  });
}
const clearSVG = () => {
  main.innerHTML = '';
  setState({
    ...currentSquaresState,
    squareCount: 0
  });
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
    renderUi(state);
  });
  mouseEventStream$.subscribe((state: MouseEvent) => {
    if (state.type === 'start') {
      setState({
        ...currentSquaresState,
        dragging: true,
        startPoint: { x: state.clientX, y: state.clientY },
        dragType: state.type
      });
    } else if (state.type === 'cancel') {
      setState({
        ...currentSquaresState,
        dragging: false,
        endPoint: { x: state.clientX, y: state.clientY },
        dragType: state.type,
        squareCount: currentSquaresState.squareCount + 1
      });
    } else {
      setState({
        ...currentSquaresState,
        coordinates: { x: state.clientX, y: state.clientY },
        dragType: state.type
      });
    }
  });
}

gatherEventStream();