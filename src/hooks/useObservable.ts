import { useState } from 'react';
import { useFunction, useOnce } from 'react-cool-hooks';
import { distinctUntilChanged, Observable } from 'rxjs';
import { useSubscription } from './useSubscription';


/**
 * @summary Provides actual value from passed observable.
 */
export function useObservable<T>(observable: Observable<T>): T | undefined;
export function useObservable<T>(observableFactory: () => Observable<T>): T | undefined;
export function useObservable<T>(...args: [Observable<T> | (() => Observable<T>)]): T | undefined {
  if (isObservable(args)) {
    return observableHook(...args);
  }

  if (isObservableFactory(args)) {
    return observableFactoryHook(...args);
  }

  return undefined;
}

function isObservable<T>(args: [
  observableOrFactory: Observable<T> | (() => Observable<T>),
]): args is [observable: Observable<T>] {
  return args.length === 1 && args[0] instanceof Observable;
}

function isObservableFactory<T>(args: [
  observableOrFactory: Observable<T> | (() => Observable<T>),
]): args is [observableFactory: () => Observable<T>] {
  return args.length === 1 && typeof args[0] === 'function';
}

function observableHook<T>(observable: Observable<T>): T | undefined {
  const mutableState = useOnce<{ value?: T, initialized: boolean }>(() => ({
    value: undefined,
    initialized: false,
  }));
  const [, setValue] = useState<T>();
  const updateState = useFunction((value: T) => {
    if (mutableState.initialized) {
      setValue(value);
    }

    mutableState.value = value;
    mutableState.initialized = true;
  });

  useSubscription(observable)((observable) => {
    return observable
      .pipe(
        distinctUntilChanged(),
      )
      .subscribe((newValue) => updateState(newValue));
  });

  mutableState.initialized = true;

  return mutableState.value;
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): T | undefined {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
