import { useRef, useState } from 'react';
import { useFunction, useMountEffect, useOnce } from 'react-cool-hooks';
import { distinctUntilChanged, Observable } from 'rxjs';
import { useSubscription } from './useSubscription';
import { isObservableArgument, isObservableFactoryArgument } from '../internal';

/**
 * @summary Provides actual value from passed observable.
 */
export function useObservable<T>(observable: Observable<T>): T | undefined;
export function useObservable<T>(observableFactory: () => Observable<T>): T | undefined;
export function useObservable<T>(...args: [Observable<T> | (() => Observable<T>)]): T | undefined {
  if (isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  return undefined;
}

function observableHook<T>(observable: Observable<T>): T | undefined {
  const mountRef = useRef(false);
  const valueRef = useRef<T>(undefined);
  const [, setValue] = useState<T>();
  const updateState = useFunction((value: T) => {
    if (mountRef.current) {
      setValue(value);
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

  return valueRef.current;
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): T | undefined {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
