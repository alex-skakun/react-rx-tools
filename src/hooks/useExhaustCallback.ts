import { useFunction, useOnce } from 'react-cool-hooks';
import {
  BehaviorSubject,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  ignoreElements,
  Observable,
  ObservableInput,
  of,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { RxCallback, useRxCallback } from './useRxCallback';
import { useSubject } from './useSubject';
import { useSubscription } from './useSubscription';
import { catchErrorAndComplete } from '../utils/catchErrorAndComplete';
import { catchErrorAndRetry } from '../utils/catchErrorAndRetry';

export function useExhaustCallback<Args extends any[]>(
  callback: (...args: Args) => ObservableInput<any>,
  onError?: (error: any) => void,
): [RxCallback<Args>, Observable<boolean>] {
  const wrappedCallback = useFunction(callback);
  const wrappedOnError = useFunction((err: any) => onError?.(err));
  const busySubject = useSubject(() => new BehaviorSubject(false));
  const [callback$, rxCallback] = useRxCallback<Args, any>(() => pipe(
    exhaustMap((args) => (
      of(args).pipe(
        tap(() => busySubject.next(true)),
        switchMap((currentArgs) => wrappedCallback(...currentArgs)),
        ignoreElements(),
        catchErrorAndComplete(wrappedOnError),
        finalize(() => busySubject.next(false)),
      )
    )),
  ));
  const busy$ = useOnce(() => busySubject.pipe(
    distinctUntilChanged(),
  ));

  useSubscription(() => (
    callback$
      .pipe(
        catchErrorAndRetry((error) => {
          busySubject.next(false);
          wrappedOnError(error);
        }),
      )
      .subscribe()
  ), { immediate: true });

  return [rxCallback, busy$];
}
