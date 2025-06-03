import { Observable } from 'rxjs';
import { isFunction } from 'value-guards';

export function _isObservableFactoryArgument<T>(args: [
  observableOrFactory: Observable<T> | (() => Observable<T>),
]): args is [observableFactory: () => Observable<T>] {
  return args.length === 1 && isFunction(args[0]);
}
