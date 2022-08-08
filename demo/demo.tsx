import {
  ChangeEvent,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PropsWithChildren,
  TransitionEvent as ReactTransitionEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFunction, useOnce } from 'react-cool-hooks';
import { createRoot } from 'react-dom/client';
import {
  animationFrames,
  animationFrameScheduler,
  buffer,
  distinctUntilChanged,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  pairwise,
  race,
  repeat,
  sample,
  scheduled,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import {
  multicastForUI,
  Output$,
  Render$,
  useObservable,
  useRxEffect,
  useRxEvent,
  useRxRef,
  useSubscription,
  useValueChange,
} from '../src';


const root = createRoot(document.getElementById('demoTest')!);

root.render(<Demo/>);

function Demo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggle = useFunction(() => {
    setIsExpanded(isExpanded => !isExpanded);
  });

  const redraws$ = useRxEffect();
  const [ref$, ref] = useRxRef<HTMLDivElement>();
  const [change$, onChange] = useRxEvent<ChangeEvent<HTMLSelectElement>, string>(e => e.currentTarget.value);
  const type = useObservable(() => change$.pipe(startWith('square')));

  useSubscription(() => ref$.pipe(
    switchMap(element => fromDragging(
      element,
      () => element.classList.add('moving'),
      () => element.classList.remove('moving'),
    )),
  ).subscribe(({ element, translateX, translateY }) => {
    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px)`;
  }));

  return <div>
    <div><span>FPS: </span><FPS/></div>
    <div><span>Draws: </span><Output$ $={redraws$}/></div>
    <div>
      <button onClick={toggle}>Toggle</button>
    </div>

    <div style={{ width: '400px' }}>
      <SliderView
        slides={[
          {
            id: 'first',
            renderContent: ({ goTo }) => (
              <div>
                <h1>I'm first</h1>
                <button type="button" onClick={() => goTo('second')}>Second</button>
              </div>
            ),
          },
          {
            id: 'second',
            renderContent: ({ goTo, back }) => (
              <div>
                <h1>I'm second</h1>
                <button type="button" onClick={back}>Go Back</button>
                <button type="button" onClick={() => goTo('third')}>Third</button>
              </div>
            ),
          },
          {
            id: 'third',
            renderContent: ({ goTo, back }) => (
              <div>
                <h1>I'm third</h1>
                <button type="button" onClick={back}>Go Back</button>
                <button type="button" onClick={() => goTo('first', SlideEffect.Previous)}>Go to root</button>
              </div>
            ),
          },
        ]}
      />
    </div>
    <Accordion label="expand settings" expanded={isExpanded}>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label htmlFor="figureTypeSelect">Type: </label>
        <select id="figureTypeSelect" defaultValue="square" onChange={onChange}>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
        </select>
      </div>
    </Accordion>

    {
      type === 'square'
        ? <div id="square" ref={ref}/>
        : <div id="circle" ref={ref}/>
    }
  </div>;
}

function FPS() {
  const fps = useObservable(() => {
    return animationFrames().pipe(
      buffer(interval(1000)),
      map(buffer => buffer.length),
    );
  });

  return <>{fps}</>;
}

type SlideID = string;
type DisplayedSlides = [SlideID] | [SlideID, SlideID];

enum SlideEffect {
  None,
  Next,
  Previous
}

type WorkingSlideEffect = SlideEffect.Next | SlideEffect.Previous;

interface SlideControls {
  goTo(slidId: SlideID, effect?: WorkingSlideEffect): void;
  back(): void;
}

interface Slide {
  id: SlideID;
  renderContent: (controls: SlideControls) => JSX.Element;
}

type SliderViewProps<T extends Record<SlideID, Slide>> = {
  slides: Slide[];
  initialSlide?: SlideID;
  onSlideChange?: (slidId: SlideID) => void;
};

function SliderView<T extends Record<SlideID, Slide>>({
  slides,
  initialSlide,
  onSlideChange,
}: SliderViewProps<T>): JSX.Element {
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const slidesMap = useMemo<Map<SlideID, Slide>>(() => {
    return new Map(slides.map(slide => [slide.id, slide]));
  }, []);
  const historyRef = useRef<SlideID[]>([]);
  const [slidesToDisplay, setSlidesToDisplay] = useState<DisplayedSlides>(() => [initialSlide ?? [...slidesMap.keys()][0]]);
  const [effect, setEffect] = useState<SlideEffect>(SlideEffect.None);
  const goTo = useFunction((slidId: keyof T, effect = SlideEffect.Next): void => {
    const slideToGo = slidesMap.get(slidId as SlideID);

    if (!slideToGo || effect === SlideEffect.None) {
      return;
    }

    if (effect === SlideEffect.Next) {
      historyRef.current.push(slidesToDisplay[0]);
    }
    setEffect(effect);
    setSlidesToDisplay(getNewSlidesBeforeEffect(slidId as SlideID, effect));
  });
  const back = useFunction((): void => {
    const slideToGo = historyRef.current.pop();

    if (slideToGo) {
      goTo(slideToGo, SlideEffect.Previous);
    }
  });
  const slideControls = useMemo<SlideControls>(() => ({ goTo, back }), []);

  const onSlideAnimationEnd = useFunction((event: ReactTransitionEvent): void => {
    if (event.propertyName === 'transform' && event.target === slidesContainerRef.current) {
      const newSlides = getNewSlidesAfterEffect(effect as WorkingSlideEffect)(slidesToDisplay);

      setSlidesToDisplay(newSlides);
      setEffect(SlideEffect.None);
      onSlideChange?.(newSlides[0]);
    }
  });

  const cssClasses = [
    'slide-view',
    ...(effect === SlideEffect.Next ? ['effect-next'] : []),
    ...(effect === SlideEffect.Previous ? ['effect-previous'] : []),
  ].join(' ');

  return <div className={cssClasses}>
    <div ref={slidesContainerRef} className="slides" onTransitionEnd={onSlideAnimationEnd}>
      {slidesToDisplay.map(slideId => {
        const slide = slidesMap.get(slideId)!;

        return <div className="slide" key={slideId} data-slide-id={slideId}>
          {slide.renderContent(slideControls)}
        </div>;
      })}
    </div>
  </div>;
}

function getNewSlidesBeforeEffect(
  slideToGo: SlideID,
  effect: WorkingSlideEffect,
): (prev: DisplayedSlides) => DisplayedSlides {
  return (prev: DisplayedSlides): DisplayedSlides => {
    switch (effect) {
    case SlideEffect.Next:
      return [...prev, slideToGo] as DisplayedSlides;
    case SlideEffect.Previous:
      return [slideToGo, ...prev] as DisplayedSlides;
    }
  };
}

function getNewSlidesAfterEffect(effect: WorkingSlideEffect): (prev: DisplayedSlides) => DisplayedSlides {
  return (prev: DisplayedSlides): DisplayedSlides => {
    switch (effect) {
    case SlideEffect.Next:
      return [prev[1]] as DisplayedSlides;
    case SlideEffect.Previous:
      return [prev[0]];
    }
  };
}

type AccordionProps = {
  label: string;
  expanded?: boolean;
};

function Accordion({ expanded = false, label, children }: PropsWithChildren<AccordionProps>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const getHeight = useFunction(() => {
    return `${containerRef.current!.scrollHeight}px`;
  });
  const expanded$ = useValueChange(expanded);
  const [click$, onClick] = useRxEvent<ReactMouseEvent<HTMLButtonElement>>();
  const style$ = useOnce(() => expanded$.pipe(
    switchMap(toTogglerFrom(click$)),
    map(toAccordionHeight),
    withLatestFrom(isReducedMotion$),
    switchMap(([height, isReducedMotion], index) => {
      if (!index || isReducedMotion) {
        return of(height);
      }

      return height === 'auto'
        ? fromTransitionEnd(containerRef.current!, 'height')
          .pipe(
            map(() => height),
            startWith(getHeight()),
          )
        : scheduled([getHeight(), height], animationFrameScheduler);
    }),
    distinctUntilChanged(),
    map(toHeightStyle),
  ));

  return <section>
    <button onClick={onClick}>{label}</button>
    <Render$ $={style$}>
      {style => <div className="accordion-content" ref={containerRef} style={style}>{children}</div>}
    </Render$>
  </section>;
}

function toTogglerFrom(source: Observable<unknown>): (initValue: boolean) => Observable<boolean> {
  return (value: boolean): Observable<boolean> => {
    return source.pipe(
      map(() => value = !value),
      startWith(value),
    );
  };
}

function toAccordionHeight(isExpanded: boolean): 'auto' | '0px' {
  return isExpanded ? 'auto' : '0px';
}

function toHeightStyle(height: string): CSSProperties {
  return { height };
}

const isReducedMotion$ = multicastForUI(new Observable(subscriber => {
  const mql = matchMedia('screen and (prefers-reduced-motion: reduce)');
  const onChange = () => subscriber.next(mql.matches);

  mql.addEventListener('change', onChange);
  subscriber.next(mql.matches);

  return () => {
    mql.removeEventListener('change', onChange);
    subscriber.complete();
  };
}));

isReducedMotion$.subscribe();

function fromTransitionEnd<T extends Element>(
  element: T,
  propertyName: string | string[],
): Observable<T> {
  return of(null)
    .pipe(
      withLatestFrom(isReducedMotion$),
      switchMap(([, isReducedMotion]) => {
        return isReducedMotion
          ? scheduled([element], animationFrameScheduler)
          : fromEvent<TransitionEvent>(element, 'transitionend')
            .pipe(
              filter(event => {
                return event.target === element && event.propertyName === propertyName;
              }),
              take(1),
              map(() => element),
            );
      }),
    );
}

type CapturePoint = {
  x: number,
  y: number,
  captureX: number;
  captureY: number;
};

function fromDragging<T extends Element>(element: T, onCapture: () => void, onRelease: () => void) {
  const { x: startX, y: startY } = element.getBoundingClientRect();

  return fromCapturing(element)
    .pipe(
      tap(onCapture),
      switchMap(capturePoint => fromMoving()
        .pipe(
          map(movePoint => ({
            ...capturePoint,
            ...movePoint,
            translateX: movePoint.x - capturePoint.captureX - startX,
            translateY: movePoint.y - capturePoint.captureY - startY,
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
    fromEvent(document, 'mouseup'),
    fromEvent(document, 'contextmenu'),
    fromEvent(document, 'touchend'),
    fromEvent(document, 'touchcancel'),
    fromEvent(document, 'mouseleave'),
    fromEvent(window, 'blur'),
  )
    .pipe(
      take(1),
    );
}
