import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useState } from 'react';
import { map } from 'rxjs';
import { RX_EFFECT_OBSERVABLE_FLAG } from '../internal';
import { useRxEffect } from './useRxEffect';
import { useSubscription } from './useSubscription';

describe('useRxEffect()', () => {
  test('emit after each render', (done) => {
    renderHook(() => {
      const [, setState] = useState(0);
      const rxEffect$ = useRxEffect();

      useSubscription(() => {
        return rxEffect$
          .pipe(
            map((renderNumber, index) => ({ renderNumber, index })),
          )
          .subscribe(({ renderNumber, index }) => {
            if (index === 0) {
              expect(renderNumber).toBe(1);
              setState((v) => ++v);
            } else if (index === 1) {
              expect(renderNumber).toBe(2);
              done();
            }
          });
      }, { immediate: true });

      return rxEffect$;
    });
  });

  test('complete after component unmount', (done) => {
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

  test('created observable is branded by special symbol', () => {
    const { result, unmount } = renderHook(() => {
      return useRxEffect();
    });

    expect(result.current[RX_EFFECT_OBSERVABLE_FLAG]).toBeTrue();
    unmount();
  });
});
