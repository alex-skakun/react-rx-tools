import { renderHook } from '@testing-library/react';
import { take } from 'rxjs';
import { useRxEffect } from './useRxEffect';
import { describe, expect, it, mock } from 'bun:test';

describe('useRxEffect()', () => {

  it('should emit after each render', (done) => {
    const { result, rerender } = renderHook(() => {
      return useRxEffect();
    });

    result.current.pipe(take(1)).subscribe((renderNumber) => {
      expect(renderNumber).toBe(1);
    });

    rerender();

    result.current.pipe(take(1)).subscribe((renderNumber) => {
      expect(renderNumber).toBe(2);
      done();
    });
  });

  it('should complete after component unmount', (done) => {
    const completeSpy = mock();
    const { result, unmount } = renderHook(() => {
      return useRxEffect();
    });

    result.current.subscribe({
      complete: completeSpy,
    });

    unmount();

    expect(completeSpy).toHaveBeenCalledTimes(1);
    done();
  });

});
