import { renderHook } from '@testing-library/react';
import { take } from 'rxjs';
import { useRxEffect } from './useRxEffect';


describe('useRxEffect()', () => {

  it('should emit after each render', () => {
    const { result, rerender } = renderHook(() => {
      return useRxEffect();
    });

    result.current.pipe(take(1)).subscribe(renderNumber => {
      expect(renderNumber).toBe(1);
    });

    rerender();

    result.current.pipe(take(1)).subscribe(renderNumber => {
      expect(renderNumber).toBe(2);
    });
  });

  it('should complete after component unmount', () => {
    const completeSpy = jest.fn();
    const { result, unmount } = renderHook(() => {
      return useRxEffect();
    });

    result.current.subscribe({
      complete:completeSpy,
    });

    unmount();

    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

});
