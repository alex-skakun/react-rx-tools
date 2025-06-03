import { useState } from 'react';
import { useOnce } from 'react-cool-hooks';
import { Observable } from 'rxjs';
import { _isObservableArgument, _isObservableFactoryArgument, _useObservableInternals } from '../internal';

/**
 * @summary Provides actual value from passed observable.
 */
export function useObservable<T>(observable: Observable<T>): T | undefined;
export function useObservable<T>(observableFactory: () => Observable<T>): T | undefined;
export function useObservable<T>(...args: [Observable<T> | (() => Observable<T>)]): T | undefined {
  if (_isObservableArgument(args)) {
    return observableHook(...args);
  }

  if (_isObservableFactoryArgument(args)) {
    return observableFactoryHook(...args);
  }

  return undefined;
}

function observableHook<T>(observable: Observable<T>): T | undefined {
  const [internalValue, setValue] = useState<T>();
  const internalStateRef = _useObservableInternals(observable, (newValue) => {
    setValue(newValue);
  });

  return internalStateRef.valuesBuffer.size > 0
    ? internalStateRef.valuesBuffer.dissolve()!
    : internalValue;
}

function observableFactoryHook<T>(observableFactory: () => Observable<T>): T | undefined {
  const observable = useOnce(observableFactory);

  return observableHook(observable);
}
