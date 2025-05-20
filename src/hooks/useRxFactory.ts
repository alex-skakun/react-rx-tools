import { useFunction, useOnce } from 'react-cool-hooks';
import { distinctUntilChanged, Observable, share, Subject, Subscriber, switchMap, TeardownLogic } from 'rxjs';
import { useValueChange } from './useValueChange';

const EMPTY_DEPS: any[] = [];

export function useRxFactory<T>(
  factory: ((subscriber: Subscriber<T>) => TeardownLogic),
  deps: any[] = EMPTY_DEPS,
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
