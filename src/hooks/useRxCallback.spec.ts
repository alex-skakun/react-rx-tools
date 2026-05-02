import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { isObservable, map, noop, pipe, tap } from 'rxjs';
import { useRxCallback } from './useRxCallback';

describe('useRxCallback', () => {
  test('returns a pair of observable and function', () => {
    const { result: { current: [obs$, callback] } } = renderHook(() => {
      return useRxCallback();
    });

    expect(isObservable(obs$)).toBeTrue();
    expect(callback).toBeFunction();
  });

  test('callback emits args into observable', (done) => {
    const { result: { current: [obs$, callback] } } = renderHook(() => {
      return useRxCallback();
    });

    obs$.subscribe((params) => {
      expect(params).toEqual([1, 'a', true]);
      done();
    });

    callback(1, 'a', true);
  });

  test('create operator only once', () => {
    const operatorFactory = mock(() => pipe(
      tap(noop),
    ));
    const { rerender } = renderHook(() => {
      return useRxCallback(operatorFactory);
    });

    rerender();
    rerender();

    expect(operatorFactory).toHaveBeenCalledTimes(1);
  });

  test('transform callback arguments though pipe', (done) => {
    const { result: { current: [obs$, callback] } } = renderHook(() => {
      return useRxCallback<[number, string], { value: string }>(() => pipe(
        map(([amount, value]) => ({
          value: value.repeat(amount),
        })),
      ));
    });

    obs$.subscribe((result) => {
      expect(result).toEqual({ value: 'testtest' });
      done();
    });

    callback(2, 'test');
  });
});
