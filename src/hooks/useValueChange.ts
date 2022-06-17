import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { useSubject } from './useSubject';


/**
 * @summary Provides memoized observable for passed value.
 * Emits new values when passed value changes. Completes when component will unmount
 */
export function useValueChange<T>(value: T): Observable<T> {
  const valueSubject = useSubject(() => new BehaviorSubject(value));
  const value$ = useOnce(() => valueSubject.pipe(distinctUntilChanged()));

  useEffect(() => {
    valueSubject.next(value);
  }, [value]);

  return value$;
}
