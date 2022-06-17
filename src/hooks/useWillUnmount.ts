import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { Observable, Subject } from 'rxjs';


/**
 * @summary Provides an observable for lifecycle hook "componentWillUnmount"
 * Creates memoized observable that emits only once and completes before component will unmount.
 */
export function useWillUnmount(): Observable<void> {
  const subject = useOnce(() => new Subject<void>());

  useEffect(() => () => {
    subject.next();
    subject.complete();
  }, []);

  return useOnce(() => subject.asObservable());
}
