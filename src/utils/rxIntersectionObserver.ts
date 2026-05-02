import { NEVER, noop, Observable, share, Subject } from 'rxjs';

export interface RxIntersectionObserver {
  observe(element: Element): Observable<IntersectionObserverEntry>;

  disconnect(): void;
}

export function rxIntersectionObserver(options?: IntersectionObserverInit): RxIntersectionObserver {
  if (!('IntersectionObserver' in globalThis)) {
    return {
      observe: () => NEVER,
      disconnect: noop,
    };
  }

  const TARGET_SUBJECTS = new Map<Element, Subject<IntersectionObserverEntry>>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => TARGET_SUBJECTS.get(entry.target)?.next(entry));
  }, options);

  return {
    observe: (element: Element): Observable<IntersectionObserverEntry> => {
      return new Observable<IntersectionObserverEntry>((subscriber) => {
        const subject = new Subject<IntersectionObserverEntry>();

        TARGET_SUBJECTS.set(element, subject);
        observer.observe(element);
        subject.subscribe(subscriber);

        return () => {
          subject.complete();
          TARGET_SUBJECTS.delete(element);
          observer.unobserve(element);
        };
      }).pipe(
        share(),
      );
    },
    disconnect: (): void => {
      observer.disconnect();
      TARGET_SUBJECTS.forEach((subject) => subject.complete());
      TARGET_SUBJECTS.clear();
    },
  };
}
