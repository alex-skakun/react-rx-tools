import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { map, Observable, startWith, Subject } from 'rxjs';
import { useSubject } from './useSubject';


export function useRxEffect(): Observable<number> {
  const subject = useSubject(() => new Subject<void>());
  const effect$ = useOnce(() => subject.pipe(
    map((_, index) => index + 1),
    startWith(0),
  ));

  useEffect(() => {
    subject.next();
  });

  return effect$;
}
