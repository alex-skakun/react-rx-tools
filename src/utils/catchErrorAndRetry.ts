import { catchError, Observable, of, OperatorFunction, switchMap, throwError, timer } from 'rxjs';
import { isNonNegativeSafeInteger, isPositiveSafeInteger } from 'value-guards';

export interface RetryOptions {
  limit?: number;
  delay?: number;
  delayStep?: number;
}

export interface RetryDetails {
  firstTime: boolean;
  retriesUsed: number;
  retriesLeft: number;
  retriesTotal: number;
  nextRetryDelay: number;
}

export function catchErrorAndRetry<T>(
  handler: (error: any, retryDetails: RetryDetails) => void,
  options: RetryOptions = {},
): OperatorFunction<T, T> {
  const { delay, limit, delayStep } = options ?? {};
  const retriesTotal = isNonNegativeSafeInteger(limit) ? limit : Number.POSITIVE_INFINITY;
  const normalizedDelayStep = isPositiveSafeInteger(delayStep) ? delayStep : 0;
  const normalizedDelay = isPositiveSafeInteger(delay) ? delay : 0;
  let retriesUsed = 0;

  return catchError<T, Observable<T>>((error, retry$) => {
    const nextDelay = normalizedDelay + (retriesUsed * normalizedDelayStep);

    try {
      handler(error, {
        firstTime: !retriesUsed,
        retriesUsed,
        retriesLeft: retriesTotal - retriesUsed,
        retriesTotal,
        nextRetryDelay: nextDelay,
      });
    } catch (e) {
      return throwError(() => e);
    }

    retriesUsed++;

    if (retriesUsed > retriesTotal) {
      return throwError(() => error);
    }

    return (nextDelay ? timer(nextDelay) : of(1)).pipe(
      switchMap(() => retry$),
    );
  });
}
