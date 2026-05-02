import { useState } from 'react';
import { useFunction, useOnce } from 'react-cool-hooks';
import { catchError, distinctUntilChanged, Observable, switchMap, throwError } from 'rxjs';
import { _isObservableArgument, _isObservableFactoryArgument, _useObservableInternals, EMPTY_DEPS } from '../internal';
import { useValueChange } from './useValueChange';

/**
 * @summary Provides actual value from passed observable.
 */
export function useObservable<T>(observable: Observable<T>): T | undefined;
export function useObservable<T>(observableFactory: () => Observable<T>, deps?: unknown[]): T | undefined;
export function useObservable<T>(...args: [Observable<T> | (() => Observable<T>), unknown[]?]): T | undefined {
  if (_isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (_isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  throw new Error('useObservable(): Unsupported set of arguments');
}

function observableHook<T>(observable: Observable<T>): T | undefined {
  const internalStateRef = _useObservableInternals(observable, (newValue, callback) => {
    setValue(newValue);
    callback();
  });
  const [internalValue, setValue] = useState<T>(internalStateRef.valueCache as T);

  if (internalStateRef.valuesBuffer.size > 0) {
    return internalStateRef.valuesBuffer.dissolve()!;
  }

  return internalStateRef.reactStateUsed ? internalValue : internalStateRef.valueCache;
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>, deps = EMPTY_DEPS): T | undefined {
  const deps$ = useValueChange(deps);
  const wrappedFactory = useFunction(observableFactory);
  const observable$ = useOnce(() => deps$.pipe(
    distinctUntilChanged((previous, current) => (
      Object.is(current, previous) || current.every((el, i) => Object.is(el, previous[i]))
    )),
    switchMap(() => wrappedFactory()),
    catchError((error) => (
      throwError(() => new Error('useObservable(): Observable finished with error', { cause: error }))
    )),
  ));

  return observableHook(observable$);
}
