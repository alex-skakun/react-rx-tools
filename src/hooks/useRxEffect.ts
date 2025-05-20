import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { BehaviorSubject, Observable } from 'rxjs';
import { useSubject } from './useSubject';

export function useRxEffect(): Observable<number> {
  const subject = useSubject(() => new BehaviorSubject<number>(0));
  const effect$ = useOnce(() => subject.asObservable());

  useEffect(() => {
    subject.next(subject.getValue() + 1);
  });

  return effect$;
}
