import { SyntheticEvent } from 'react';
import { useFunction, useOnce } from 'react-cool-hooks';
import { Observable, Subject } from 'rxjs';
import { useSubject } from './useSubject';


interface SyntheticEventListener<E extends SyntheticEvent> extends CallableFunction {
  (event: E): void;
}

/**
 * @summary Provides memoized observable and memoized event listener callback.
 * Completes when component will unmount.
 */
export function useRxEvent<E extends SyntheticEvent = SyntheticEvent>(): [Observable<E>, SyntheticEventListener<E>] {
  const eventSubject = useSubject(() => new Subject<E>());
  const event$ = useOnce(() => eventSubject.asObservable());
  const onEvent = useFunction<SyntheticEventListener<E>>((event: E): void => eventSubject.next(event));

  return [event$, onEvent];
}
