import { describe, expect, it, mock } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useRxFactory } from './useRxFactory';
import { Observable } from 'rxjs';
import { useSubscription } from './useSubscription';

describe('useRxFactory()', () => {
  it('create an observable from factory', () => {
    const subscribe = mock();
    const unsubscribe = mock();
    const { result, unmount } = renderHook(() => {
      const $ = useRxFactory((_subscriber) => {
        subscribe();

        return () => unsubscribe();
      });

      useSubscription(() => $.subscribe(), { immediate: true });

      return $;
    });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(0);
    expect(result.current instanceof Observable).toBeTrue();
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('invoke factory when dependencies change', () => {
    const factory = mock();
    const { rerender } = renderHook(({ dep }) => {
      const $ = useRxFactory(factory, [dep]);

      useSubscription(() => $.subscribe(), { immediate: true });

      return $;
    }, { initialProps: { dep: 1 } });

    expect(factory).toHaveBeenCalledTimes(1);
    rerender({ dep: 1 });
    expect(factory).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
