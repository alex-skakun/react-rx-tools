import { useFunction, useOnce } from 'react-cool-hooks';
import { BehaviorSubject, distinctUntilChanged, Observable, ReplaySubject } from 'rxjs';
import { useSubject } from './useSubject';


interface RxRefCallback<T> extends CallableFunction {
  (value: T): void;
}

/**
 * @summary Provides memoized observable and memoized RefCallback.
 * Replays the latest ref value for new subscribers.
 * Completes when component will unmount.
 */
export function useRxRef<T>(initialValue?: T): [Observable<T>, RxRefCallback<T>] {
  const refSubject = useSubject(() => {
    return initialValue ? new BehaviorSubject<T>(initialValue) : new ReplaySubject<T>(1);
  });
  const ref$ = useOnce(() => refSubject.pipe(distinctUntilChanged()));
  const refCallback = useFunction<RxRefCallback<T>>((element: T): void => refSubject.next(element));

  return [ref$, refCallback];
}
