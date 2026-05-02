import { useFunction, useOnce } from 'react-cool-hooks';
import { distinctUntilChanged, Observable, share, Subject, Subscriber, switchMap, TeardownLogic } from 'rxjs';
import { useValueChange } from './useValueChange';
import { EMPTY_DEPS } from '../internal';

export function useRxFactory<T>(
  factory: ((subscriber: Subscriber<T>) => TeardownLogic),
  deps: unknown[] = EMPTY_DEPS,
): Observable<T> {
  const wrappedFactory = useFunction(factory);
  const deps$ = useValueChange(deps);

  return useOnce(() => deps$.pipe(
    distinctUntilChanged((previous, current) => (
      Object.is(current, previous) || current.every((el, i) => Object.is(el, previous[i]))
    )),
    switchMap(() => new Observable(wrappedFactory)),
    share({ connector: () => new Subject() }),
  ));
}
