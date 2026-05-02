import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useDidMount, useRxMount } from './useRxMount';

describe('useRxMount()', () => {
  test('should emit after component mounted', () => {
    const nextCallback = mock();

    renderHook(() => {
      const mount$ = useRxMount();

      mount$.subscribe(nextCallback);

      useEffect(() => {
        expect(nextCallback).toHaveBeenCalledTimes(1);
      }, []);

      expect(nextCallback).toHaveBeenCalledTimes(0);
    });
  });

  test('should complete before component unmount', () => {
    const completeCallback = mock();

    renderHook(() => {
      const mount$ = useRxMount();

      mount$.subscribe({
        complete: completeCallback,
      });

      useEffect(() => {
        return () => {
          expect(completeCallback).toHaveBeenCalledTimes(1);
        };
      }, []);

      expect(completeCallback).toHaveBeenCalledTimes(0);
    });
  });

  test('should replay for late subscriber', () => {
    const nextCallback = mock();

    renderHook(async () => {
      const mount$ = useRxMount();

      useEffect(() => {
        mount$.subscribe(nextCallback);
        expect(nextCallback).toHaveBeenCalledTimes(1);
      }, []);
    });
  });

  test('accessible via alias useDidMount()', () => {
    expect(Object.is(useRxMount, useDidMount)).toBeTrue();
  });
});
