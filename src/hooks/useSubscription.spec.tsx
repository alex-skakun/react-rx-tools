import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { Observable, Subject, Subscription } from 'rxjs';
import { useSubscription } from './useSubscription';
import { describe, expect, it, mock, spyOn } from 'bun:test';

describe('useSubscription()', () => {

  it('should invoke passed callback immediately, when immediate=true', () => {
    const callback = mock(() => new Subscription());

    renderHook(() => {
      useSubscription(callback, { immediate: true });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('should invoke passed callback after mount, when immediate=false', () => {
    const callback = mock(() => new Subscription());

    renderHook(() => {
      useSubscription(callback);
      useEffect(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      }, []);
      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  it('should not invoke callback again when component rerender', () => {
    const callback = mock(() => new Subscription());

    const { rerender } = renderHook(() => {
      useSubscription(callback);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    rerender();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should invoke callback again, after source observable change', () => {

    const initialProps = { source$: new Subject() };
    const callback = mock((obs: Observable<unknown>) => obs.subscribe());

    const { rerender } = renderHook(({ source$ }: { source$: Observable<unknown> }) => {
      useSubscription(source$, callback);
    }, { initialProps });

    expect(callback).toHaveBeenCalledTimes(1);
    rerender(initialProps);
    expect(callback).toHaveBeenCalledTimes(1);
    rerender({ source$: new Subject() });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe before unmount', () => {
    const subscription = new Subscription();
    const unsubscribeSpy = spyOn(subscription, 'unsubscribe');
    const callback = () => subscription;

    renderHook(() => {
      useSubscription(callback);

      useEffect(() => () => {
        expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
      }, []);
    });
  });

  it('should unsubscribe when dependency change', () => {
    const subscriptions = [new Subscription(), new Subscription(), new Subscription()];
    const unmountSpy = spyOn(subscriptions[0], 'unsubscribe');
    const unsubscribeSpy2 = spyOn(subscriptions[1], 'unsubscribe');
    const unsubscribeSpy1 = spyOn(subscriptions[2], 'unsubscribe');
    const callback = () => subscriptions.pop()!;

    const { rerender, unmount } = renderHook(({ $ }: { $: Observable<void> }) => {
      useSubscription($, callback);
    }, { initialProps: { $: new Subject<void>() } });

    expect(unsubscribeSpy1).toHaveBeenCalledTimes(0);
    expect(unsubscribeSpy2).toHaveBeenCalledTimes(0);
    expect(unmountSpy).toHaveBeenCalledTimes(0);

    rerender({ $: new Subject<void>() });

    expect(unsubscribeSpy1).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy2).toHaveBeenCalledTimes(0);
    expect(unmountSpy).toHaveBeenCalledTimes(0);

    rerender({ $: new Subject<void>() });

    expect(unsubscribeSpy1).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy2).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(0);

    unmount();

    expect(unsubscribeSpy1).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy2).toHaveBeenCalledTimes(1);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

});
