import { useOnce } from 'react-cool-hooks';
import { BehaviorSubject, distinctUntilChanged, NEVER, Observable, of, ReplaySubject, Subject, switchMap } from 'rxjs';
import { isDefined, isNonEmptyArray } from 'value-guards';
import { useSubject } from './useSubject';

const TEAR_DOWN_VALUE = Symbol('TEAR_DOWN_VALUE');

interface ComboRef<T> extends CallableFunction {
  (value: T): () => void;

  get current(): T;

  set current(value: T);
}

/**
 * @summary Provides memoized observable and memoized RefCallback.
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
    switchMap((refValue) => isCorrectRefValue(refValue) ? of(refValue) : NEVER),
  ));
  const ref = useOnce(() => createComboRef(refSubject, args[0]));

  return [ref$, ref];
}

function createComboRef<T>(subject: Subject<T | typeof TEAR_DOWN_VALUE>, initialValue: T | undefined): ComboRef<T> {
  let currentValue: T | undefined = initialValue;

  return Object.defineProperty(
    ((newValue: T) => {
      subject.next(currentValue = newValue);

      return () => subject.next(TEAR_DOWN_VALUE);
    }) as ComboRef<T>,
    'current',
    {
      enumerable: true,
      get(): T | undefined {
        return currentValue ?? undefined;
      },
      set(newValue: T) {
        this(newValue);
      },
    },
  );
}

function isCorrectRefValue<T>(value: T | typeof TEAR_DOWN_VALUE): value is T {
  return isDefined(value) && value !== TEAR_DOWN_VALUE;
}
