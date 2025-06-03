import { render, renderHook } from '@testing-library/react';
import { Observable, switchMap, toArray } from 'rxjs';
import { useRxRef } from './useRxRef';
import { useSubscription } from './useSubscription';
import { describe, expect, it, mock } from 'bun:test';

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

  it('teardown sub observables when ref changes or destroys', () => {
    const subscribeCallback = mock();
    const unsubscribeCallback = mock();
    const obs$ = new Observable(() => {
      subscribeCallback();

      return () => unsubscribeCallback();
    });

    const { result, unmount } = renderHook(() => {
      const [ref$, ref] = useRxRef<string>();

      useSubscription(() => ref$.pipe(switchMap(() => obs$)).subscribe(), { immediate: true });

      return ref;
    });

    result.current('first');
    expect(subscribeCallback).toHaveBeenCalledTimes(1);
    expect(unsubscribeCallback).toHaveBeenCalledTimes(0);
    result.current('second');
    expect(subscribeCallback).toHaveBeenCalledTimes(2);
    expect(unsubscribeCallback).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribeCallback).toHaveBeenCalledTimes(2);
  });

});
