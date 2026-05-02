import { isObservable, Observable } from 'rxjs';
import { RefObject } from 'react';
import { Nullish } from 'value-guards';

export const RX_EFFECT_OBSERVABLE_FLAG = Symbol('RX_EFFECT_OBSERVABLE_FLAG');

export type RxEffectObservable<Source extends Observable<number> = Observable<number>> = Source & {
  [RX_EFFECT_OBSERVABLE_FLAG]: true;
}

export type RxEffectRef = RefObject<Nullish<RxEffectObservable>>;

export function markAsRxEffectObservable<Source extends Observable<number>>(source: Source): RxEffectObservable<Source> {
  return Object.defineProperty(source, RX_EFFECT_OBSERVABLE_FLAG, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  }) as RxEffectObservable<Source>;
}

export function isRxEffectObservable<Source extends Observable<number> = Observable<number>>(
  observable: unknown | Source
): observable is RxEffectObservable<Source> {
  return isObservable(observable) && (observable as RxEffectObservable)[RX_EFFECT_OBSERVABLE_FLAG];
}
