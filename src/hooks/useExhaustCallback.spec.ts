import { describe, expect, mock, test } from 'bun:test';
import { EMPTY, isObservable, NEVER, of, Subject, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { renderHook } from '@testing-library/react';
import { useExhaustCallback } from './useExhaustCallback';
import { useObservable } from './useObservable';
import { act } from 'react';

describe('useExhaustCallback()', () => {
  test('returns callback and representing pending observable', () => {
    const { result } = renderHook(() => useExhaustCallback(() => EMPTY));
    const [callback, pending$] = result.current;

    expect(callback).toBeFunction();
    expect(isObservable(pending$)).toBeTrue();
  });

  test('invoke callback', () => {
    const cb = mock(() => EMPTY);
    const { result } = renderHook(() => useExhaustCallback(cb));
    const [callback] = result.current;

    callback();

    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('skip next invocations until previous one completed', () => {
    const completeSubject = new Subject<void>();
    const cb = mock(() => NEVER.pipe(takeUntil(completeSubject)));
    const { result } = renderHook(() => useExhaustCallback(cb));
    const [callback] = result.current;

    callback();
    callback();
    callback();
    expect(cb).toHaveBeenCalledTimes(1);
    completeSubject.next();
    callback();
    callback();
    callback();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test('observable represents pending state', () => {
    const completeSubject = new Subject<void>();
    const cb = mock(() => NEVER.pipe(takeUntil(completeSubject)));
    const { result } = renderHook(() => {
      const [cbk, pending$] = useExhaustCallback(cb);
      const pending = useObservable(pending$);
      return [cbk, pending ?? false] as const;
    });

    expect(result.current[1]).toBeFalse();
    act(() => result.current[0]());
    expect(result.current[1]).toBeTrue();
    act(() => completeSubject.next());
    expect(result.current[1]).toBeFalse();
  });

  test('reset pending state if observable throws error', () => {
    const errorSubject = new Subject<void>();
    const cb = mock(() => errorSubject.pipe(
      switchMap(() => throwError(() => new Error('Test error'))),
    ));
    const { result } = renderHook(() => {
      const [cbk, pending$] = useExhaustCallback(cb);
      const pending = useObservable(pending$);
      return [cbk, pending ?? false] as const;
    });

    expect(result.current[1]).toBeFalse();
    act(() => result.current[0]());
    expect(result.current[1]).toBeTrue();
    act(() => errorSubject.next());
    expect(result.current[1]).toBeFalse();
  });

  test('pass error into onError when observable throws error', () => {
    const onError = mock();
    const errorSubject = new Subject<void>();
    const cb = mock(() => errorSubject.pipe(
      switchMap(() => throwError(() => new Error('Test error'))),
    ));
    const { result } = renderHook(() => useExhaustCallback(cb, onError));

    act(() => result.current[0]());
    act(() => errorSubject.next());
    expect(onError).toHaveBeenLastCalledWith(new Error('Test error'));
  });

  test('resubscribe automatically when internal observable throws error', () => {
    const onError = mock((err) => {
      if (err.message === 'Test error 1') {
        throw new Error('Test error 2');
      }
    });
    const onComplete = mock();
    const triggerSubject = new Subject<void>();
    const cb = mock((index) => triggerSubject.pipe(
      take(1),
      switchMap(() => (
        index === 1
          ? throwError(() => new Error('Test error 1'))
          : of(1)
      )),
      tap({ complete: onComplete }),
    ));
    const { result } = renderHook(() => useExhaustCallback(cb, onError));

    act(() => result.current[0](1));
    act(() => triggerSubject.next());
    expect(onComplete).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenNthCalledWith(1, new Error('Test error 1'));
    expect(onError).toHaveBeenNthCalledWith(2, new Error('Test error 2'));
    act(() => result.current[0](2));
    act(() => triggerSubject.next());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
