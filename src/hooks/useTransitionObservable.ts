import { catchError, distinctUntilChanged, Observable, switchMap, throwError } from 'rxjs';
import { _isObservableArgument, _isObservableFactoryArgument, _useObservableInternals, EMPTY_DEPS } from '../internal';
import { useFunction, useOnce } from 'react-cool-hooks';
import { useState, useTransition } from 'react';
import { useValueChange } from './useValueChange';

export function useTransitionObservable<T>(observable: Observable<T>): [boolean, T | undefined];
export function useTransitionObservable<T>(observableFactory: () => Observable<T>, deps?: unknown[]): [boolean, T | undefined];
export function useTransitionObservable<T>(...args: [Observable<T> | (() => Observable<T>), unknown[]?]): [boolean, T | undefined] {
  if (_isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (_isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  throw new Error('useTransitionObservable(): Unsupported set of arguments');
}

function observableHook<T>(observable: Observable<T>): [boolean, T | undefined] {
  const [pending, startTransition] = useTransition();
  const internalStateRef = _useObservableInternals(observable, (newValue, callback) => {
    startTransition(() => {
      setValue(newValue);
      callback();
    });
  });
  const [internalValue, setValue] = useState<T>(internalStateRef.valueCache as T);

  if (internalStateRef.valuesBuffer.size > 0) {
    return [pending, internalStateRef.valuesBuffer.dissolve()!];
  }

  return [
    pending,
    internalStateRef.reactStateUsed ? internalValue : internalStateRef.valueCache,
  ];
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>, deps = EMPTY_DEPS): [boolean, T | undefined] {
  const deps$ = useValueChange(deps);
  const wrappedFactory = useFunction(observableFactory);
  const observable$ = useOnce(() => deps$.pipe(
    distinctUntilChanged((previous, current) => (
      Object.is(current, previous) || current.every((el, i) => Object.is(el, previous[i]))
    )),
    switchMap(() => wrappedFactory()),
    catchError((error) => (
      throwError(() => new Error('useTransitionObservable(): Observable finished with error', { cause: error }))
    )),
  ));

  return observableHook(observable$);
}
