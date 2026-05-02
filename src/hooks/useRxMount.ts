import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { Observable, ReplaySubject } from 'rxjs';


/**
 * @summary Provides an observable for lifecycle hook "componentDidMount"
 * Creates memoized observable that emits only once after component did mount.
 * Replays for each new subscriber while component lifecycle, completes before component will unmount.
 */
export function useRxMount(): Observable<void> {
  const subject = useOnce(() => new ReplaySubject<void>(1));

  useEffect(() => {
    subject.next();

    return () => subject.complete();
  }, []);

  return useOnce(() => subject.asObservable());
}

/**
 * @deprecated  useRxMount() is preferred, useDidMount() will be removed in next major release
 */
export const useDidMount = useRxMount;
