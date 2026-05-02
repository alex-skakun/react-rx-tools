import { filter, fromEvent, map, merge, NEVER, Observable, share, Subject, Subscription, switchMap, takeUntil, throwError } from 'rxjs';
import { isPresent, OverrideProperties } from 'value-guards';

export interface FromFileOptions {
  readAs?: 'text' | 'dataURL' | 'arrayBuffer';
  abortSubject?: Subject<any>;
}

export function fromFileReader(file: Blob): Observable<string>;
export function fromFileReader(
  file: Blob,
  options: OverrideProperties<FromFileOptions, { readAs: 'arrayBuffer' }>,
): Observable<ArrayBuffer>;
export function fromFileReader(
  file: Blob,
  options: OverrideProperties<FromFileOptions, { readAs: 'dataURL' | 'text' }>,
): Observable<string>;
export function fromFileReader(file: Blob, options: FromFileOptions): Observable<string>;

export function fromFileReader(
  file: Blob,
  options?: FromFileOptions,
): Observable<ArrayBuffer> | Observable<string> {
  if (!('FileReader' in globalThis)) {
    return NEVER;
  }

  return new Observable<ArrayBuffer | string>((subscriber) => {
    const fileReader = new FileReader();
    const abortSubscription = options?.abortSubject
      ? options.abortSubject.subscribe(() => fileReader.abort())
      : Subscription.EMPTY;
    const readerSubscription = merge(
      fromEvent(fileReader, 'error').pipe(
        switchMap(() => throwError(() => fileReader.error)),
      ),
      fromEvent(fileReader, 'abort').pipe(
        switchMap(() => throwError(() => new Error('Reading of the file was aborted'))),
      ),
      fromEvent(fileReader, 'load').pipe(
        map(() => fileReader.result),
        filter(isPresent),
      ),
    )
      .pipe(
        takeUntil(fromEvent(fileReader, 'loadend')),
      )
      .subscribe(subscriber);

    switch (options?.readAs) {
      case 'arrayBuffer':
        fileReader.readAsArrayBuffer(file);
        break;
      case 'dataURL':
        fileReader.readAsDataURL(file);
        break;
      case 'text':
      default:
        fileReader.readAsText(file);
    }

    return () => {
      if (fileReader.readyState !== FileReader.DONE) {
        fileReader.abort();
      }

      abortSubscription.unsubscribe();
      readerSubscription.unsubscribe();
    };
  }).pipe(
    share(),
  ) as (Observable<string> | Observable<ArrayBuffer>);
}
