import { useFunction, useOnce } from 'react-cool-hooks';
import { Observable, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { useDidMount } from './useDidMount';
import { useWillUnmount } from './useWillUnmount';
import { isFunction, isNonEmptyRecord } from 'value-guards';
import { useValueChange } from './useValueChange';

export type SubscriptionFactory = {
  (): Subscription;
};

export type MultiSubscriptionFactory<T extends Observable<any>> = {
  (source: T): Subscription;
};

export type UseSubscriptionConfig = {
  immediate: boolean;
};

/**
 * @summary Custom hook for subscribing to observables.
 * Unsubscribes automatically when component will unmount or received updated dependencies.
 * Optionally allows to subscribe immediately (before hook "componentDidMount").
 */
export function useSubscription<T extends Observable<any>>(
  source: T,
  callback: MultiSubscriptionFactory<T>,
  config?: UseSubscriptionConfig,
): void;
export function useSubscription(callback: SubscriptionFactory, config?: UseSubscriptionConfig): void;

export function useSubscription<T extends Observable<any>>(
  ...args: [
    callbackOrObservable: SubscriptionFactory | T,
    callbackOrConfig?: UseSubscriptionConfig | MultiSubscriptionFactory<T>,
    config?: UseSubscriptionConfig
  ]
): void {
  if (isMultiUse<T>(args)) {
    return multiUseHook(...args);
  } else if (isOnceUse<T>(args)) {
    return onceUseHook(...args);
  }
}

function isMultiUse<T extends Observable<any>>(
  args: [
    callbackOrObservable: SubscriptionFactory | T,
    callbackOrConfig?: UseSubscriptionConfig | MultiSubscriptionFactory<T>,
    config?: UseSubscriptionConfig
  ],
): args is [T, MultiSubscriptionFactory<T>, UseSubscriptionConfig?] {
  return (args.length >= 2 && args.length <= 3)
    && args[0] instanceof Observable
    && isFunction(args[1])
    && (args[2] === undefined || isNonEmptyRecord(args[2]));
}

function isOnceUse<T extends Observable<any>>(
  args: [
    callbackOrObservable: SubscriptionFactory | T,
    callbackOrConfig?: UseSubscriptionConfig | MultiSubscriptionFactory<T>,
    config?: UseSubscriptionConfig
  ],
): args is [SubscriptionFactory, UseSubscriptionConfig?] {
  return (args.length >= 1 && args.length <= 2)
    && isFunction(args[0])
    && (args[1] === undefined || isNonEmptyRecord(args[1]));
}

function multiUseHook<T extends Observable<any>>(
  observable: T,
  callback: MultiSubscriptionFactory<T>,
  config?: UseSubscriptionConfig
): void {
  const didMount$ = useDidMount();
  const willUnmount$ = useWillUnmount();
  const source$ = useValueChange(observable);
  const wrappedCallback = useFunction<MultiSubscriptionFactory<T>>(callback);
  const toSubObservable = useFunction((sourceObservable: T) => new Observable(() => {
    const sub = wrappedCallback(sourceObservable);

    return () => sub.unsubscribe();
  }));

  useOnce(() => {
    (config?.immediate ? of(undefined) : didMount$)
      .pipe(
        switchMap(() => source$),
        switchMap(toSubObservable),
        takeUntil(willUnmount$),
      )
      .subscribe();
  });
}

function onceUseHook(callback: SubscriptionFactory, config?: UseSubscriptionConfig): void {
  const didMount$ = useDidMount();
  const willUnmount$ = useWillUnmount();
  const wrappedCallback = useFunction(callback);
  const toSubObservable = useFunction(() => new Observable(() => {
    const sub = wrappedCallback();

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
