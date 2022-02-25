import { useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, Observable } from 'rxjs';
import { getCurrentFromObservable } from './helpers/getCurrentFromObservable';

export function useObservable<T>(obs$: Observable<T>): T | undefined {
  let initialValue = useMemo(() => getCurrentFromObservable(obs$), [obs$]);
  let [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    let subscription = obs$
      .pipe(distinctUntilChanged())
      .subscribe(value => setValue(value));

    return () => subscription.unsubscribe();
  }, [obs$]);

  return value;
}