import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useDidMount } from './useDidMount';


describe('useDidMount()', () => {

  it('should emit after component mounted', () => {
    const nextCallback = jest.fn();

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
    const completeCallback = jest.fn();

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
    const nextCallback = jest.fn();

    renderHook(async () => {
      const didMount$ = useDidMount();

      useEffect(() => {
        didMount$.subscribe(nextCallback);
        expect(nextCallback).toHaveBeenCalledTimes(1);
      }, []);
    });
  });

});
