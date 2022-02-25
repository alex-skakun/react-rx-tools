import { Observable } from 'rxjs';


export function getCurrentFromObservable<T>(obs$: Observable<T>): T | undefined {
  let currentValue: T;
  let subscription = obs$.subscribe(value => currentValue = value);

  subscription.unsubscribe();

  return currentValue;
}
