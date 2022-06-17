import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { Subject } from 'rxjs';


export function useSubject<T extends Subject<any>>(subjectFactory: () => T): T {
  const subject = useOnce(subjectFactory);

  useEffect(() => {
    return () => {
      subject.complete();
    };
  }, []);

  return subject;
}