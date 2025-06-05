import { Observable } from 'rxjs';
import { _isObservableArgument, _isObservableFactoryArgument, _useObservableInternals } from '../internal';
import { useOnce } from 'react-cool-hooks';
import { useRef, useState, useTransition } from 'react';

export function useTransitionObservable<T>(observable: Observable<T>): [boolean, T | undefined];
export function useTransitionObservable<T>(observableFactory: () => Observable<T>): [boolean, T | undefined];
export function useTransitionObservable<T>(...args: [Observable<T> | (() => Observable<T>)]): [boolean, T | undefined] {
  if (_isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (_isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  return [false, undefined];
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
    internalStateRef.reactStateUsed ? internalValue : internalStateRef.valueCache
  ];
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): [boolean, T | undefined] {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
