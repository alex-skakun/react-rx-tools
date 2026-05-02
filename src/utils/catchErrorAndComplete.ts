import { catchError, EMPTY, Observable, OperatorFunction, throwError } from 'rxjs';

export function catchErrorAndComplete<T>(handler: (error: any) => void): OperatorFunction<T, T> {
  return catchError<T, Observable<never>>((error) => {
    try {
      handler(error);
    } catch (e) {
      return throwError(() => e);
    }
    return EMPTY;
  });
}
