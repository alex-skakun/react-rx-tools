import { useOnce } from 'react-cool-hooks';
import { BehaviorSubject, distinctUntilChanged, NEVER, Observable, ReplaySubject, Subject, switchMap } from 'rxjs';
import { isNonEmptyArray, isPresent } from 'value-guards';
import { useSubject } from './useSubject';
import { useSubscription } from './useSubscription';
import { RefObject } from 'react';

const TEAR_DOWN_VALUE = Symbol('TEAR_DOWN_VALUE');
const COMBO_REF_FLAG = Symbol('COMBO_REF_FLAG');
const RX_REF = Symbol('RX_REF');

export interface ComboRef<T> extends CallableFunction {
  (value: T): () => void;

  get current(): T;

  set current(value: T);

  [COMBO_REF_FLAG]: true;
  [RX_REF]: Observable<T>;
}

/**
 * @summary Provides memoized observable and ComboRef object (RefObject and RefCallback in one).
 * Replays the latest ref value for new subscribers.
 * Completes when component will unmount.
 */
export function useRxRef<T>(initialValue?: T): [Observable<T>, ComboRef<T>];

export function useRxRef<T>(...args: [initialValue?: T]): [Observable<T>, ComboRef<T>] {
  const refSubject = useSubject(() => {
    return isNonEmptyArray(args)
      ? new BehaviorSubject<T | typeof TEAR_DOWN_VALUE>(args[0])
      : new ReplaySubject<T | typeof TEAR_DOWN_VALUE>(1);
  });
  const ref$ = useOnce(() => refSubject.pipe(
    distinctUntilChanged(),
    switchMap((refValue) => isCorrectRefValue(refValue) ? new BehaviorSubject(refValue) : NEVER),
  ));
  const ref = useOnce(() => createComboRef(refSubject, ref$, args[0]));

  useSubscription(ref$, (r$) => r$.subscribe(), { immediate: true });

  return [ref$, ref];
}

function createComboRef<T>(
  subject: Subject<T | typeof TEAR_DOWN_VALUE>,
  rxRef: Observable<T>,
  initialValue: T | undefined,
): ComboRef<T> {
  let currentValue: T | undefined = initialValue;

  return Object.defineProperties(
    ((newValue: T) => {
      subject.next(currentValue = newValue);

      return () => subject.next(TEAR_DOWN_VALUE);
    }) as ComboRef<T>,
    {
      'current': {
        enumerable: true,
        get(): T | undefined {
          return currentValue ?? undefined;
        },
        set(newValue: T) {
          this(newValue);
        },
      },
      [RX_REF]: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: rxRef,
      },
      [COMBO_REF_FLAG]: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true,
      },
    },
  );
}

function isCorrectRefValue<T>(value: T | typeof TEAR_DOWN_VALUE): value is T {
  return isPresent(value) && value !== TEAR_DOWN_VALUE;
}

export function isComboRef<T>(ref: RefObject<T> | unknown): ref is ComboRef<T> {
  return Boolean((ref as ComboRef<T>)?.[COMBO_REF_FLAG]);
}

export function getRxRefFromComboRef<T>(ref: ComboRef<T>): Observable<T> {
  return ref[RX_REF];
}
