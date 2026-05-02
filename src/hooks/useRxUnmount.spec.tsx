import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useRxUnmount, useWillUnmount } from './useRxUnmount';

describe('useRxUnmount()', () => {
  test('should emit before component unmounted', () => {
    const nextCallback = mock();

    renderHook(() => {
      const willUnmount$ = useRxUnmount();

      willUnmount$.subscribe(nextCallback);

      useEffect(() => {
        expect(nextCallback).toHaveBeenCalledTimes(0);

        return () => {
          expect(nextCallback).toHaveBeenCalledTimes(1);
        };
      }, []);

      expect(nextCallback).toHaveBeenCalledTimes(0);
    });
  });

  test('should complete before component unmounted', () => {
    const completeCallback = mock();

    renderHook(() => {
      const willUnmount$ = useRxUnmount();

      willUnmount$.subscribe({
        complete: completeCallback,
      });

      useEffect(() => {
        expect(completeCallback).toHaveBeenCalledTimes(0);

        return () => {
          expect(completeCallback).toHaveBeenCalledTimes(1);
        };
      }, []);

      expect(completeCallback).toHaveBeenCalledTimes(0);
    });
  });

  test('accessible via alias useWillUnmount()', () => {
    expect(Object.is(useRxUnmount, useWillUnmount)).toBeTrue();
  });
});
