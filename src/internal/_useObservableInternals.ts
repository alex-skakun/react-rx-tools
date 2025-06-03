import { distinctUntilChanged, filter, map, mergeWith, Observable } from 'rxjs';
import { useDidMount } from '../hooks/useDidMount';
import { useFunction, useOnce } from 'react-cool-hooks';
import { Queue } from './Queue';
import { useSubscription } from '../hooks/useSubscription';

export interface InternalObservableState<T> {
  didMount: boolean;
  valuesBuffer: Queue<T>;
}

export function _useObservableInternals<T>(observable: Observable<T>, setStateFn: (newValue: T) => void): InternalObservableState<T> {
  const didMount$ = useDidMount();
  const internalStateRef = useOnce<InternalObservableState<T>>(() => ({
    didMount: false,
    valuesBuffer: new Queue<T>(),
  }));
  const updateState = useFunction((newValue: T): void => {
    if (internalStateRef.didMount) {
      setStateFn(newValue);
    } else {
      internalStateRef.valuesBuffer.push(newValue);
    }
  });

  useSubscription(() => (
    didMount$.subscribe(() => {
      internalStateRef.didMount = true;
    })
  ), { immediate: true });

  useSubscription(observable, (currentObservable) => (
    currentObservable
      .pipe(
        distinctUntilChanged(),
        mergeWith(didMount$.pipe(
          map(() => internalStateRef.valuesBuffer),
          filter((valuesBuffer) => valuesBuffer.size > 0),
          map((valuesBuffer) => valuesBuffer.dissolve()!),
        )),
      )
      .subscribe((newValue) => {
        updateState(newValue);
      })
  ), { immediate: true });

  return internalStateRef;
}
