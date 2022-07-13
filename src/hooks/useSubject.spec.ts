import { renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { useSubject } from './useSubject';


describe('useSubject()', () => {

  it('should return memoized subject', () => {
    const { result, rerender } = renderHook(() => {
      return useSubject(() => new Subject<void>());
    });

    const result1 = result.current;

    rerender();

    const result2 = result.current;

    expect(result1).toBe(result2);
  });

  it('should complete after unmount', () => {
    const completeSpy = jest.fn();
    const { result, unmount } = renderHook(() => {
      return useSubject(() => new Subject<void>());
    });

    result.current.subscribe({
      complete: completeSpy
    });

    unmount();

    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

});
