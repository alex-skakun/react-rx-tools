import { Observable } from 'rxjs';
import { isFunction } from 'value-guards';

export function _isObservableFactoryArgument<T>(args: [
  observableOrFactory: Observable<T> | (() => Observable<T>),
  deps?: unknown[],
]): args is [observableFactory: () => Observable<T>, deps?: unknown[]] {
  return (args.length === 1 && isFunction(args[0]))
    || (args.length === 2 && isFunction(args[0]) && Array.isArray(args[1]));
}
