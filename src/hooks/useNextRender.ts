import { animationFrameScheduler, defer, isObservable, Observable, observeOn, of, switchMap, take, throwError } from 'rxjs';
import { useFunction } from 'react-cool-hooks';
import { useState } from 'react';
import { isNonPresent } from 'value-guards';
import { isRxEffectObservable, RxEffectObservable, RxEffectRef } from '../internal';
import { catchErrorAndComplete } from '../utils/catchErrorAndComplete';
import { getRxRefFromComboRef, isComboRef } from './useRxRef';
import { useRxEffect } from './useRxEffect';

export interface FromNextRender extends CallableFunction {
  (): Observable<number>;
}

export function useNextRender(rxEffect$: RxEffectObservable): FromNextRender;
export function useNextRender(rxEffectRef: RxEffectRef): FromNextRender;
export function useNextRender(): FromNextRender;

export function useNextRender(rxEffectOrRefObject?: RxEffectObservable | RxEffectRef): FromNextRender {
  const [error, setError] = useState<any>(null);
  const internalRxEffect = useRxEffect();

  if (error) {
    throw error;
  }

  return useFunction(() => (
    defer(() => {
      if (isComboRef<RxEffectObservable>(rxEffectOrRefObject)) {
        return getRxRefFromComboRef(rxEffectOrRefObject).pipe(
          switchMap((rxEffect$) => (
            isRxEffectObservable(rxEffect$)
              ? rxEffect$
              : throwError(createWrongObservableError)
          )),
        );
      }

      if (!isObservable(rxEffectOrRefObject)) {
        if (isNonPresent(rxEffectOrRefObject)) {
          return internalRxEffect.pipe(
            observeOn(animationFrameScheduler),
          );
        }

        return isRxEffectObservable(rxEffectOrRefObject.current)
          ? rxEffectOrRefObject.current
          : internalRxEffect.pipe(
            switchMap((index) => (
              isRxEffectObservable(rxEffectOrRefObject.current)
                ? of(index).pipe(observeOn(animationFrameScheduler))
                : throwError(createWrongObservableError)
            )),
          );
      }

      if (!isRxEffectObservable(rxEffectOrRefObject)) {
        return throwError(createWrongObservableError);
      }

      return rxEffectOrRefObject.pipe(
        observeOn(animationFrameScheduler),
      );
    })
      .pipe(
        take(1),
        catchErrorAndComplete((err) => {
          setError(err);
        }),
      )
  ));
}

function createWrongObservableError() {
  return new Error('useNextRender(): received observable is not RxEffectObservable');
}
