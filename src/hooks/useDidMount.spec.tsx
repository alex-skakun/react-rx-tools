import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useDidMount } from './useDidMount';
import { describe, expect, it, mock } from 'bun:test';

describe('useDidMount()', () => {

  it('should emit after component mounted', () => {
    const nextCallback = mock();

    renderHook(() => {
      const didMount$ = useDidMount();

      didMount$.subscribe(nextCallback);

      useEffect(() => {
        expect(nextCallback).toHaveBeenCalledTimes(1);
      }, []);

      expect(nextCallback).toHaveBeenCalledTimes(0);
    });
  });

  it('should complete before component unmount', () => {
    const completeCallback = mock();

    renderHook(() => {
      const didMount$ = useDidMount();

      didMount$.subscribe({
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

  it('should replay for late subscriber', () => {
    const nextCallback = mock();

    renderHook(async () => {
      const didMount$ = useDidMount();

      useEffect(() => {
        didMount$.subscribe(nextCallback);
        expect(nextCallback).toHaveBeenCalledTimes(1);
      }, []);
    });
  });

});
