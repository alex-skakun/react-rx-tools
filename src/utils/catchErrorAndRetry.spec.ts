import { describe, expect, mock, test } from 'bun:test';
import { defer, noop, of, throwError } from 'rxjs';
import { catchErrorAndRetry } from './catchErrorAndRetry';

describe('catchErrorAndRetry()', () => {
  test('resubscribe after error', () => {
    let counter = 1;
    const resubscribe = mock(() => of(1));
    defer(() => {
      if (counter === 1) {
        counter++;
        return throwError(() => 'test');
      } else {
        return resubscribe();
      }
    })
      .pipe(
        catchErrorAndRetry(noop),
      )
      .subscribe();

    expect(resubscribe).toHaveBeenCalled();
  });

  test('throw error after limit of error exceeded', () => {
    const onError = mock();

    throwError(() => 'test')
      .pipe(
        catchErrorAndRetry(noop, { limit: 1 }),
      )
      .subscribe({
        error: onError,
      });

    expect(onError).toHaveBeenCalledWith('test');
  });

  test('throw error when callback throws', () => {
    const onError = mock();

    throwError(() => 'test')
      .pipe(
        catchErrorAndRetry(() => {
          throw 'in callback';
        }),
      )
      .subscribe({
        error: onError,
      });

    expect(onError).toHaveBeenCalledWith('in callback');
  });

  test('pass an error into callback', () => {
    const onError = mock();

    throwError(() => 'test')
      .pipe(
        catchErrorAndRetry(onError, { limit: 0 }),
      )
      .subscribe();

    expect(onError).toHaveBeenCalledWith('test', {
      firstTime: true,
      nextRetryDelay: 0,
      retriesLeft: 0,
      retriesTotal: 0,
      retriesUsed: 0,
    });
  });

  test('pass retry details into callback', () => {
    const onError = mock();

    throwError(() => 'test')
      .pipe(
        catchErrorAndRetry(onError, { limit: 2 }),
      )
      .subscribe();

    expect(onError).toHaveBeenNthCalledWith(1, 'test', {
      firstTime: true,
      nextRetryDelay: 0,
      retriesLeft: 2,
      retriesTotal: 2,
      retriesUsed: 0,
    });
    expect(onError).toHaveBeenNthCalledWith(2, 'test', {
      firstTime: false,
      nextRetryDelay: 0,
      retriesLeft: 1,
      retriesTotal: 2,
      retriesUsed: 1,
    });
    expect(onError).toHaveBeenNthCalledWith(3, 'test', {
      firstTime: false,
      nextRetryDelay: 0,
      retriesLeft: 0,
      retriesTotal: 2,
      retriesUsed: 2,
    });
  });
});
