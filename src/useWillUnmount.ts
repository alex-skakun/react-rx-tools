import { Observable, ReplaySubject } from 'rxjs';
import { useEffect, useMemo } from 'react';

export default function useWillUnmount(): Observable<void> {
  const subject: ReplaySubject<void> = useMemo(() => new ReplaySubject(1), []);

  useEffect(() => () => {
    subject.next();
    subject.complete();
  }, []);

  return subject.asObservable();
}
