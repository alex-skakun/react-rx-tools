import { distinctUntilChanged, Observable } from 'rxjs';
import { isObservableArgument, isObservableFactoryArgument } from '../internal';
import { useFunction, useMountEffect, useOnce } from 'react-cool-hooks';
import { useRef, useState, useTransition } from 'react';
import { useSubscription } from './useSubscription';

export function useTransitionObservable<T>(observable: Observable<T>): [boolean, T | undefined];
export function useTransitionObservable<T>(observableFactory: () => Observable<T>): [boolean, T | undefined];
export function useTransitionObservable<T>(...args: [Observable<T> | (() => Observable<T>)]): [boolean, T | undefined] {
  if (isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  return [false, undefined];
}

function observableHook<T>(observable: Observable<T>): [boolean, T | undefined] {
  const mountRef = useRef(false);
  const valueRef = useRef<T>(undefined);
  const [pending, startTransition] = useTransition();
  const [, setValue] = useState<T>();
  const updateState = useFunction((value: T) => {
    if (mountRef.current) {
      startTransition(() => {
        setValue(value);
      });
    }

    valueRef.current = value;
  });

  useMountEffect(() => {
    mountRef.current = true;
  });

  useSubscription(observable, (observable) => {
    return observable
      .pipe(
        distinctUntilChanged(),
      )
      .subscribe((newValue) => updateState(newValue));
  }, { immediate: true });

  return [pending, valueRef.current];
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): [boolean, T | undefined] {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
