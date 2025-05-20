import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useWillUnmount } from './useWillUnmount';
import { describe, expect, it, mock } from 'bun:test';

describe('useWillUnmount()', () => {

  it('should emit before component unmounted', () => {
    const nextCallback = mock();

    renderHook(() => {
      const willUnmount$ = useWillUnmount();

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

  it('should complete before component unmounted', () => {
    const completeCallback = mock();

    renderHook(() => {
      const willUnmount$ = useWillUnmount();

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

});
