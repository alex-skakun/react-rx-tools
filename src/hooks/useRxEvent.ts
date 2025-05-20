import { SyntheticEvent } from 'react';
import { map, Observable, Subject } from 'rxjs';
import { isNonEmptyArray } from 'value-guards';
import { useFunction, useOnce } from 'react-cool-hooks';
import { useSubject } from './useSubject';


export interface SyntheticEventListener<E extends SyntheticEvent> extends CallableFunction {
  (event: E): void;
}

export function useRxEvent(): [Observable<SyntheticEvent>, SyntheticEventListener<SyntheticEvent>];
export function useRxEvent<E extends SyntheticEvent>(): [Observable<E>, SyntheticEventListener<E>];
export function useRxEvent<E extends SyntheticEvent, R>(mapFn: (event: E) => R): [Observable<R>, SyntheticEventListener<E>];

/**
 * @summary Provides memoized observable and memoized event listener callback.
 * Completes when component will unmount.
 */
export function useRxEvent<E extends SyntheticEvent = SyntheticEvent, R = E>(
  ...args: [mapFn?: (event: E) => R]
): [Observable<R>, SyntheticEventListener<E>] {
  const eventSubject = useSubject(() => new Subject<E>());
  const mapFn = useFunction((event: E): R => {
    return isNonEmptyArray(args) ? args[0](event) : event as unknown as R;
  });
  const event$ = useOnce(() => eventSubject.pipe(map(mapFn)));
  const onEvent = useFunction<SyntheticEventListener<E>>((event: E): void => eventSubject.next(event));

  return [event$, onEvent];
}
