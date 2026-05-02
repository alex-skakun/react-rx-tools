import { animationFrameScheduler, filter, fromEvent, map, NEVER, Observable, observeOn, race, take, timer } from 'rxjs';

export function fromAnimationEnd<T extends HTMLElement | SVGElement>(
  element: T,
  animationNameOrNames: string | string[],
  duration?: number,
): Observable<T> {
  return race(
    duration ? timer(duration) : NEVER,
    fromEvent<AnimationEvent>(element, 'animationend', { passive: true }).pipe(
      filter(({ target, animationName }) => (
        target === element && (
          Array.isArray(animationNameOrNames)
            ? animationNameOrNames.includes(animationName)
            : animationName === animationNameOrNames
        )
      )),
      take(1),
    ),
  ).pipe(
    map(() => element),
    observeOn(animationFrameScheduler),
  );
}
