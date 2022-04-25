import { Observable } from 'rxjs';


export default function getCurrentFromObservable<T>(obs$: Observable<T>): T | undefined {
  let currentValue: T | undefined;
  const subscription = obs$.subscribe(value => currentValue = value);

  subscription.unsubscribe();

  return currentValue;
}
