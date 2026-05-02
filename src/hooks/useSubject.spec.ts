import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { useSubject } from './useSubject';

describe('useSubject()', () => {
  test('return memoized subject', () => {
    const { result, rerender } = renderHook(() => {
      return useSubject(() => new Subject<void>());
    });

    const result1 = result.current;

    rerender();

    const result2 = result.current;

    expect(result1).toBe(result2);
  });

  test('complete after unmount', () => {
    const completeSpy = mock();
    const { result, unmount } = renderHook(() => {
      return useSubject(() => new Subject<void>());
    });

    result.current.subscribe({
      complete: completeSpy,
    });

    unmount();

    expect(completeSpy).toHaveBeenCalledTimes(1);
  });
});
