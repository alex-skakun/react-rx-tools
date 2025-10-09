import { isObservable, Observable } from 'rxjs';

export function _isObservableArgument<T>(args: [
  observableOrFactory: Observable<T> | (() => Observable<T>),
]): args is [observable: Observable<T>] {
  return args.length === 1 && isObservable(args[0]);
}
