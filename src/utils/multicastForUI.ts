import { BehaviorSubject, MonoTypeOperatorFunction, Observable, pipe, ReplaySubject, share } from 'rxjs';
import { isNonEmptyArray } from 'value-guards';


export function multicastForUI<T>(source: Observable<T>): Observable<T>;
export function multicastForUI<T>(source: Observable<T>, initialValue: T): Observable<T>;
export function multicastForUI<T>(): MonoTypeOperatorFunction<T>;
export function multicastForUI<T>(initialValue: T): MonoTypeOperatorFunction<T>;

export function multicastForUI<T>(
  ...args: [sourceOrInitial?: Observable<T> | T, initialValue?: T]
): Observable<T> | MonoTypeOperatorFunction<T> {
  if (isFactoryUsage<T>(args)) {
    return args[0].pipe(
      share<T>({
        resetOnComplete: false,
        resetOnRefCountZero: false,
        connector: () => {
          return isInitialValuePassedIntoFactory(args)
            ? new BehaviorSubject<T>(args[1])
            : new ReplaySubject<T>(1);
        },
      }),
    );
  }

  if (isOperatorUsage<T>(args)) {
    return pipe(
      share<T>({
        resetOnComplete: false,
        resetOnRefCountZero: false,
        connector: () => {
          return isNonEmptyArray(args) ? new BehaviorSubject<T>(args[0]) : new ReplaySubject<T>(1);
        },
      }),
    );
  }

  throw new Error(`multicastForUI: Unknown list of arguments.\n${args.join('\n')}`);
}

function isFactoryUsage<T>(
  args: [sourceOrInitial?: Observable<T> | T, initialValue?: T],
): args is [source: Observable<T>, initialValue?: T] {
  return args.length <= 2 && args[0] instanceof Observable;
}

function isOperatorUsage<T>(
  args: [sourceOrInitial?: Observable<T> | T, initialValue?: T],
): args is [initialValue?: T] {
  return !isFactoryUsage(args);
}

function isInitialValuePassedIntoFactory<T>(
  args: [source: Observable<T>, initialValue?: T],
): args is [source: Observable<T>, initialValue: T] {
  return args.length > 1;
}
