import { describe, expect, mock, test } from 'bun:test';
import { firstValueFrom, Subject } from 'rxjs';
import { fromFileReader } from './fromFileReader';

describe('fromFileReader()', () => {
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });

  test('read file as text by default', async () => {
    const fileContent = await firstValueFrom(
      fromFileReader(file),
    );

    expect(fileContent).toBe('test');
  });

  test('read file as text', async () => {
    const fileContent = await firstValueFrom(
      fromFileReader(file, { readAs: 'text' }),
    );

    expect(fileContent).toBe('test');
  });

  test('read file as dataURL', async () => {
    const fileContent = await firstValueFrom(
      fromFileReader(file, { readAs: 'dataURL' }),
    );

    expect(fileContent).toBe('data:text/plain;base64,dGVzdA==');
  });

  test('read file as ArrayBuffer', async () => {
    const fileContent = await firstValueFrom(
      fromFileReader(file, { readAs: 'arrayBuffer' }),
    );

    expect(fileContent).toEqual(await file.arrayBuffer());
  });

  test('abort reading by unsubscribing', async () => {
    const onError = mock();
    const onComplete = mock();
    const onNext = mock();
    const sub = fromFileReader(
      new Blob(
        Array.from({ length: 100_000 }, (_, index) => String.fromCharCode(index)),
        { type: 'text/plain' },
      )
    ).subscribe({
      next: onNext,
      error: onError,
      complete: onComplete,
    });

    sub.unsubscribe();

    expect(onNext).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('abort reading by subject', async () => {
    const onError = mock();
    const onComplete = mock();
    const onNext = mock();
    const abortSubject = new Subject<void>();

    fromFileReader(
      new Blob(
        Array.from({ length: 100_000 }, (_, index) => String.fromCharCode(index)),
        { type: 'text/plain' },
      ),
      { abortSubject },
    ).subscribe({
      next: onNext,
      error: onError,
      complete: onComplete,
    });

    abortSubject.next();
    abortSubject.complete();

    expect(onNext).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(new Error('Reading of the file was aborted'));
  });
});
