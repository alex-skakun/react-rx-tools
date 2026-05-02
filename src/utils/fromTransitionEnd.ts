import { animationFrameScheduler, filter, fromEvent, map, NEVER, Observable, observeOn, race, take, tap, timer } from 'rxjs';

export function fromTransitionEnd<T extends HTMLElement | SVGElement>(
  element: T,
  transitionPropertyOrProperties: string | string[],
  duration?: number,
): Observable<T> {
  return race(
    duration ? timer(duration) : NEVER,
    fromEvent<TransitionEvent>(element, 'transitionend', { passive: true }).pipe(
      filter(({ target, propertyName }) => (
        target === element && (
          Array.isArray(transitionPropertyOrProperties)
            ? transitionPropertyOrProperties.includes(propertyName)
            : propertyName === transitionPropertyOrProperties
        )
      )),
      take(1),
    ),
  ).pipe(
    map(() => element),
    observeOn(animationFrameScheduler),
  );
}
