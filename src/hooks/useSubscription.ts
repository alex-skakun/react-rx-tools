import { useRef } from 'react';
import { useFunction, useOnce } from 'react-cool-hooks';
import { Observable, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { useDidMount } from './useDidMount';
import { useRxRef } from './useRxRef';
import { useWillUnmount } from './useWillUnmount';


type UseSubscriptionConfig = {
  immediate: boolean;
};

/**
 * @summary Custom hook for subscribing to observables.
 * Unsubscribes automatically when component will unmount or received updated dependencies.
 * Optionally allows to subscribe immediately (before hook "componentDidMount").
 */
export function useSubscription<T extends Observable<any>>($: T): ((callback: ($: T) => Subscription) => void);
export function useSubscription(callback: () => Subscription, config?: UseSubscriptionConfig): void;
export function useSubscription<T extends Observable<any>>(
  ...args: [callbackOrObservable: (() => Subscription) | T, config?: UseSubscriptionConfig]
): void | ((callback: ($: T) => Subscription) => void) {
  if (isMultiUse<T>(args)) {
    return multiUseHook(...args);
  } else if (isOnceUse<T>(args)) {
    return onceUseHook(...args);
  }
}

function isMultiUse<T extends Observable<any>>(
  args: [callbackOrObservable: (() => Subscription) | T, config?: UseSubscriptionConfig],
): args is [T] {
  return args.length === 1 && args[0] instanceof Observable;
}

function isOnceUse<T extends Observable<any>>(
  args: [callbackOrObservable: (() => Subscription) | T, config?: UseSubscriptionConfig],
): args is [callback: () => Subscription, config?: UseSubscriptionConfig] {
  return (args.length >= 1 && args.length <= 2) &&
    typeof args[0] === "function";
}

function multiUseHook<T extends Observable<any>>(observable: T): ((callback: ($: T) => Subscription) => void) {
  const willUnmount$ = useWillUnmount();
  const [source$, setSource] = useRxRef<T>();
  const callbackRef = useRef<($: T) => Subscription>();
  const toSubObservable = useFunction((sourceObservable: T) => new Observable(() => {
    const sub = callbackRef.current!(sourceObservable);

    return () => sub.unsubscribe();
  }));

  useOnce(() => {
    source$
      .pipe(
        switchMap(toSubObservable),
        takeUntil(willUnmount$),
      )
      .subscribe();
  });

  return (callback: ($: T) => Subscription): void => {
    callbackRef.current = callback;
    setSource(observable);
  };
}

function onceUseHook(callback: () => Subscription, config?: UseSubscriptionConfig): void {
  const didMount$ = useDidMount();
  const willUnmount$ = useWillUnmount();
  const toSubObservable = useFunction(() => new Observable(() => {
    const sub = callback();

    return () => sub.unsubscribe();
  }));

  useOnce(() => {
    (config?.immediate ? of(undefined) : didMount$)
      .pipe(
        switchMap(toSubObservable),
        takeUntil(willUnmount$),
      )
      .subscribe();
  });
}
