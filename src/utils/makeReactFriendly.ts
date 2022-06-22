import { BehaviorSubject, MonoTypeOperatorFunction, Observable, pipe, ReplaySubject, share } from 'rxjs';


export function makeReactFriendly<T>(source: Observable<T>): Observable<T>;
export function makeReactFriendly<T>(source: Observable<T>, initialValue: T): Observable<T>;
export function makeReactFriendly<T>(): MonoTypeOperatorFunction<T>;
export function makeReactFriendly<T>(initialValue: T): MonoTypeOperatorFunction<T>;

export function makeReactFriendly<T>(
  ...args: [sourceOrInitial?: Observable<T> | T, initialValue?: T]
): Observable<T> | MonoTypeOperatorFunction<T> {
  if (isFactoryUsage<T>(args)) {
    return args[0].pipe(
      share<T>({
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
        connector: () => {
          return isInitialValuePassedIntoOperator(args)
            ? new BehaviorSubject<T>(args[0]) :
            new ReplaySubject<T>(1);
        },
      }),
    );
  }

  throw new Error(`makeReactFriendly: Unknown list of arguments.\n${args.join('\n')}`);
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

function isInitialValuePassedIntoOperator<T>(
  args: [initialValue?: T],
): args is [initialValue: T] {
  return !!args.length;
}
