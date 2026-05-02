import { NEVER, Observable, share } from 'rxjs';

export function fromResizeObserver(target: Element, options?: ResizeObserverOptions): Observable<ResizeObserverEntry> {
  if (!('ResizeObserver' in globalThis)) {
    return NEVER;
  }

  return new Observable<ResizeObserverEntry>((subscriber) => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => subscriber.next(entry));
    });

    observer.observe(target, options);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }).pipe(
    share(),
  );
}
