import { useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, Observable } from 'rxjs';
import getCurrentFromObservable from './helpers/getCurrentFromObservable';


export default function useObservable<T>(obs$: Observable<T>): T | undefined {
  const initialValue = useMemo(() => getCurrentFromObservable(obs$), [obs$]);
  const [value, setValue] = useState<T | undefined>(initialValue);

  useEffect(() => {
    const subscription = obs$
      .pipe(distinctUntilChanged())
      .subscribe(value => setValue(value));

    return () => subscription.unsubscribe();
  }, [obs$]);

  return value;
}
