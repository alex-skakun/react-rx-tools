import { createRoot } from 'react-dom/client';
import {
  animationFrames,
  buffer,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  pairwise,
  race,
  repeat,
  sample,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { Output$, useObservable, useRxEffect, useRxRef, useSubscription } from '../src';


const root = createRoot(document.getElementById('demoTest')!);

root.render(<Demo/>);

function Demo() {
  const [ref$, ref] = useRxRef<HTMLDivElement>();
  const redraws$ = useRxEffect();

  useSubscription(() => ref$.pipe(
    switchMap(element => fromDragging(
      element,
      () => element.classList.add('moving'),
      () => element.classList.remove('moving'),
    )),
  ).subscribe(({ element, translateX, translateY }) => {
    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px)`;
  }));

  return <div id="square" ref={ref}>
    <div><span>FPS: </span><FPS/></div>
    <div><span>Draws: </span><Output$ $={redraws$}/></div>
  </div>;
}

function FPS() {
  const redraws$ = useRxEffect();
  const fps = useObservable(() => {
    return animationFrames().pipe(
      buffer(interval(1000)),
      map(buffer => buffer.length),
    );
  });

  return <>{fps}/<Output$ $={redraws$}/></>;
}

type CapturePoint = {
  x: number,
  y: number,
  captureX: number;
  captureY: number;
};

function fromDragging<T extends Element>(element: T, onCapture: () => void, onRelease: () => void) {
  return fromCapturing(element)
    .pipe(
      tap(onCapture),
      switchMap(capturePoint => fromMoving()
        .pipe(
          map(movePoint => ({
            ...capturePoint,
            ...movePoint,
            translateX: movePoint.x - capturePoint.captureX,
            translateY: movePoint.y - capturePoint.captureY,
            element,
          })),
          takeUntil(fromReleasing().pipe(tap(onRelease))),
        )),
    );
}

function fromCapturing(element: Element) {
  const preventDefault = (event: Event) => event.preventDefault();
  const isOneTouch = (event: TouchEvent) => event.touches.length === 1;
  const mouseEventToCapturePoint = ({ clientX, clientY }: MouseEvent): CapturePoint => {
    const { x, y } = element.getBoundingClientRect();

    return {
      x: clientX,
      y: clientY,
      captureX: Math.round(clientX - x),
      captureY: Math.round(clientY - y),
    };
  };
  const touchEventToCapturePoint = ({ touches }: TouchEvent): CapturePoint => {
    const { clientX, clientY } = touches.item(0)!;
    const { x, y } = element.getBoundingClientRect();

    return {
      x: clientX,
      y: clientY,
      captureX: Math.round(clientX - x),
      captureY: Math.round(clientY - y),
    };
  };

  return race(
    fromEvent<MouseEvent>(element, 'mousedown')
      .pipe(
        tap<MouseEvent>(preventDefault),
        map(mouseEventToCapturePoint),
      ),
    fromEvent<TouchEvent>(element, 'touchstart', { passive: false })
      .pipe(
        filter(isOneTouch),
        tap<TouchEvent>(preventDefault),
        map(touchEventToCapturePoint),
      ),
  ).pipe(
    switchMap((point) => anyMove().pipe(
      filter(({ x, y }) => !!(x - point.x) || !!(y - point.y)),
      take(1),
      map(() => point),
      takeUntil(fromReleasing()),
    )),
    take(1),
    repeat(),
  );
}

function anyMove(): Observable<{ x: number, y: number }> {
  const mouseEventToPoint = ({ clientX, clientY }: MouseEvent) => ({ x: clientX, y: clientY });
  const touchEventToPoint = ({ changedTouches }: TouchEvent) => {
    const { clientX, clientY } = changedTouches.item(0)!;

    return {
      x: Math.round(clientX),
      y: Math.round(clientY),
    };
  };

  return race(
    fromEvent<MouseEvent>(document.body, 'mousemove')
      .pipe(
        map(mouseEventToPoint),
      ),
    fromEvent<TouchEvent>(document.body, 'touchmove')
      .pipe(
        map(touchEventToPoint),
      ),
  );
}

function fromMoving() {
  return anyMove()
    .pipe(
      sample(animationFrames()),
      pairwise(),
      map(([previous, current]) => {
        return {
          ...current,
          dx: current.x - previous.x,
          dy: current.y - previous.y,
        };
      }),
    );
}

function fromReleasing() {
  return merge(
    fromEvent(document.body, 'mouseup'),
    fromEvent(document.body, 'contextmenu'),
    fromEvent(document.body, 'touchend'),
    fromEvent(document.body, 'touchcancel'),
    fromEvent(document, 'mouseleave'),
    fromEvent(window, 'blur'),
  )
    .pipe(
      take(1),
    );
}
