import { useOnce, useUnmountEffect } from 'react-cool-hooks';
import { Subject } from 'rxjs';

export function useSubject<T extends Subject<any>>(subjectFactory: () => T): T {
  const subject = useOnce(subjectFactory);

  useUnmountEffect(() => {
    subject.complete();
  });

  return subject;
}
