import { Observable, ReplaySubject } from 'rxjs';
import { useEffect, useMemo } from 'react';


export default function useDidMount(): Observable<void> {
  const subject: ReplaySubject<void> = useMemo(() => new ReplaySubject(), []);

  useEffect(() => {
    subject.next();
    subject.complete();
  }, []);

  return subject.asObservable();
}
