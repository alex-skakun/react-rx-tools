import { NEVER, Observable, share } from 'rxjs';

export function fromMutationObserver(node: Node, options?: MutationObserverInit): Observable<MutationRecord> {
  if (!('MutationObserver' in globalThis)) {
    return NEVER;
  }

  return new Observable<MutationRecord>((subscriber) => {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => subscriber.next(record));
    });

    observer.observe(node, options);

    return () => observer.disconnect();
  }).pipe(
    share(),
  );
}
