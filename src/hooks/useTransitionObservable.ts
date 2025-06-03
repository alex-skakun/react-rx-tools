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
  const [internalValue, setValue] = useState<T>();
  const lastUsedValue = useRef<T>(undefined);
  const internalStateRef = _useObservableInternals(observable, (newValue) => {
    startTransition(() => {
      setValue(newValue);
    });
  });

  const actualValue = internalStateRef.valuesBuffer.size > 0
    ? internalStateRef.valuesBuffer.dissolve()!
    : (pending ? lastUsedValue.current : internalValue);

  lastUsedValue.current = actualValue;

  return [pending, actualValue];
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): [boolean, T | undefined] {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
