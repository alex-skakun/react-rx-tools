import { forwardRef, Fragment, ReactElement, ReactNode, RefAttributes, useImperativeHandle, useMemo } from 'react';
import { animationFrameScheduler, from, ObservableInput, observeOn } from 'rxjs';
import { isPresent, Nullish, OverrideProperties } from 'value-guards';
import { useTransitionObservable } from '../hooks/useTransitionObservable';
import { useObservable } from '../hooks/useObservable';
import { useRxEffect } from '../hooks/useRxEffect';
import { markAsRxEffectObservable, RxEffectObservable } from '../internal';

export type Render$Props<T> = RefAttributes<RxEffectObservable> & {
  definedOnly?: boolean;
  withTransition?: boolean;
  $: ObservableInput<T>;
  fallback?: ReactNode;
  children: (value: T | undefined, pending: boolean) => ReactNode;
};

interface Render$ extends CallableFunction {
  displayName: 'Render$';

  <T>(
    props: OverrideProperties<Render$Props<T>, {
      definedOnly: true,
      children: (value: NonNullable<T>, pending: boolean) => ReactNode;
    }>,
  ): ReactElement | null;

  <T>(
    props: OverrideProperties<Render$Props<T>, {
      definedOnly?: false,
      children: (value: Nullish<T>, pending: boolean) => ReactNode;
    }>,
  ): ReactElement | null;
}

export const Render$ = forwardRef<RxEffectObservable, Omit<Render$Props<unknown>, 'ref'>>((
  { definedOnly, withTransition = false, $: source, fallback, children },
  forwardedRef,
): ReactElement | null => {
  const observable = useMemo(() => from(source), [source]);
  const [pending, value] = withTransition ? useTransitionObservable(observable) : [false, useObservable(observable)];
  const effect$ = useRxEffect();

  useImperativeHandle(
    forwardedRef,
    () => markAsRxEffectObservable(effect$.pipe(observeOn(animationFrameScheduler))),
    [],
  );

  if (definedOnly) {
    return (
      <Fragment>
        {isPresent(value) ? (children(value, pending) ?? fallback ?? null) : (fallback ?? null)}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        {children(value, pending) ?? fallback ?? null}
      </Fragment>
    );
  }
}) as Render$;

Render$.displayName = 'Render$';
