import { useEffect, useRef } from 'react';
import { isObservable, Observable, of, Subscription, switchMap, takeUntil, Unsubscribable } from 'rxjs';
import { isFunction, isNonEmptyRecord, isPresent, Nullish } from 'value-guards';
import { useFunction, useOnce } from 'react-cool-hooks';
import { useValueChange } from './useValueChange';
import { useRxUnmount } from './useRxUnmount';
import { useRxMount } from './useRxMount';

export interface SubscriptionFactory extends CallableFunction {
  (): Subscription;
}

export interface MultiSubscriptionFactory<T extends Observable<any>> extends CallableFunction {
  (source: T): Subscription;
}

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
    return _useSubscription(...args);
  }

  if (isOnceUse<T>(args)) {
    return _useSubscription(undefined, ...args);
  }

  throw new Error('useSubscription(): Unknown set of arguments');
}

function isMultiUse<T extends Observable<any>>(
  args: [
    callbackOrObservable: SubscriptionFactory | T,
    callbackOrConfig?: UseSubscriptionConfig | MultiSubscriptionFactory<T>,
    config?: UseSubscriptionConfig
  ],
): args is [T, MultiSubscriptionFactory<T>, UseSubscriptionConfig?] {
  return (args.length >= 2 && args.length <= 3)
    && isObservable(args[0])
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

function _useSubscription<T extends Observable<any>>(
  observable: Nullish<T>,
  callback: MultiSubscriptionFactory<T>,
  config?: UseSubscriptionConfig,
): void {
  const errorRef = useRef<Nullish<unknown>>(null);
  const didMount$ = useRxMount();
  const willUnmount$ = useRxUnmount();
  const source$ = useValueChange(observable ?? undefined);
  const wrappedCallback = useFunction((sourceObservable: Nullish<T>) => (
    callback(sourceObservable ?? (undefined as unknown as T))
  ));
  const toSubObservable = useFunction((sourceObservable: Nullish<T>) => new Observable((subscriber) => {
    const sub = wrappedCallback(sourceObservable);

    if (!isUnsubscribable(sub)) {
      subscriber.error(new Error('useSubscription(): callback must return Subscription implementation'));
    }

    return () => sub.unsubscribe();
  }));

  useOnce(() => {
    (config?.immediate ? of(undefined) : didMount$)
      .pipe(
        switchMap(() => source$),
        switchMap(toSubObservable),
        takeUntil(willUnmount$),
      )
      .subscribe({
        error: (err) => {
          errorRef.current = err;
        },
      });
  });

  useEffect(() => {
    if (isPresent(errorRef.current)) {
      throw errorRef.current;
    }
  });
}

function isUnsubscribable(target: any): target is Unsubscribable {
  return isFunction(target?.unsubscribe);
}
