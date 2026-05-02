import { distinctUntilChanged, filter, map, mergeWith, Observable } from 'rxjs';
import { isNonPresent, isPresent, Nullish } from 'value-guards';
import { useFunction, useOnce } from 'react-cool-hooks';
import { useRxMount } from '../hooks/useRxMount';
import { useSubscription } from '../hooks/useSubscription';
import { Queue } from './Queue';

export interface InternalObservableState<T> {
  didMount: boolean;
  valuesBuffer: Queue<T>;
  valueCache: T | undefined;
  reactStateUsed: boolean;
  error: Nullish<unknown>;
}

export function _useObservableInternals<T>(
  observable: Observable<T>,
  setStateFn: (newValue: T, callback: () => void) => void,
): InternalObservableState<T> {
  const mount$ = useRxMount();
  const internalStateRef = useOnce<InternalObservableState<T>>(() => ({
    didMount: false,
    valuesBuffer: new Queue<T>(),
    valueCache: undefined,
    reactStateUsed: false,
    error: null,
  }));
  const updateState = useFunction((newValue: T): void => {
    if (isNonPresent(internalStateRef.error)) {
      if (internalStateRef.didMount) {
        setStateFn(newValue, () => {
          internalStateRef.valueCache = newValue;
          internalStateRef.reactStateUsed = true;
        });
      } else {
        internalStateRef.valuesBuffer.push(newValue);
        internalStateRef.valueCache = newValue;
      }
    }
  });

  useSubscription(() => (
    mount$.subscribe(() => {
      internalStateRef.didMount = true;
    })
  ), { immediate: true });

  useSubscription(observable, (currentObservable) => (
    currentObservable
      .pipe(
        distinctUntilChanged(),
        mergeWith(mount$.pipe(
          map(() => internalStateRef.valuesBuffer),
          filter((valuesBuffer) => valuesBuffer.size > 0),
          map((valuesBuffer) => valuesBuffer.dissolve()!),
        )),
      )
      .subscribe({
        next: (newValue) => {
          updateState(newValue);
        },
        error: (err) => {
          internalStateRef.error = err;
        },
      })
  ), { immediate: true });

  if (isPresent(internalStateRef.error)) {
    throw internalStateRef.error;
  }

  return internalStateRef;
}
