import { describe, expect, mock, test } from 'bun:test';
import { noop, throwError } from 'rxjs';
import { catchErrorAndComplete } from './catchErrorAndComplete';

describe('catchErrorAndComplete()', () => {
  test('complete an observable that throws an error', () => {
    const onComplete = mock();
    const onError = mock();

    throwError(() => new Error('test'))
      .pipe(
        catchErrorAndComplete(noop),
      )
      .subscribe({
        complete: onComplete,
        error: onError,
      });

    expect(onComplete).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  test('pass an error into callback', () => {
    const onError = mock();
    const error = new Error('test');

    throwError(() => error)
      .pipe(
        catchErrorAndComplete(onError),
      )
      .subscribe();

    expect(onError).toHaveBeenCalledWith(error);
  });
});
