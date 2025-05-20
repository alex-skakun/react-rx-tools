import { render, renderHook } from '@testing-library/react';
import { Observable, toArray } from 'rxjs';
import { useRxRef } from './useRxRef';
import { useSubscription } from './useSubscription';
import { describe, expect, it } from 'bun:test';

describe('useRxRef()', () => {

  it('should provide an observable and ref callback', () => {
    renderHook(() => {
      const [ref$, ref] = useRxRef<void>();

      expect(ref$ instanceof Observable).toBeTruthy();
      expect(typeof ref === 'function').toBeTruthy();
    });
  });

  it('should emit ref, when it is available', () => {
    const container = document.createElement('div');
    const Test = () => {
      const [ref$, ref] = useRxRef<HTMLDivElement>();

      useSubscription(() => ref$.subscribe((el) => {
        expect(el).toBe(container.querySelector('[data-testid="testDiv"]') as HTMLDivElement);
      }), { immediate: true });

      return <div data-testid="testDiv" ref={ref}>Test</div>;
    };

    render(<Test/>, { container });
  });

  it('should emit ref for late subscriber', () => {
    const container = document.createElement('div');
    const Test = () => {
      const [ref$, ref] = useRxRef<HTMLDivElement>();

      useSubscription(() => ref$.subscribe((el) => {
        expect(el).toBe(container.querySelector('[data-testid="testDiv"]') as HTMLDivElement);
      }));

      return <div data-testid="testDiv" ref={ref}>Test</div>;
    };

    render(<Test/>, { container });
  });

  it('should keep actual value in property "current"', () => {
    const { result, unmount } = renderHook(() => {
      return useRxRef('test');
    });
    const [ref$, ref] = result.current;

    ref$
      .pipe(
        toArray(),
      )
      .subscribe((allValues) => {
        expect(allValues).toEqual([
          'test',
          'another test',
          'one more test',
        ]);
      });

    expect(ref.current).toBe('test');

    ref('another test');
    expect(ref.current).toBe('another test');

    ref.current = 'one more test';
    expect(ref.current).toBe('one more test');

    unmount();
  });

});
