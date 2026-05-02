import { forwardRef, Fragment, ReactElement, ReactNode, RefAttributes, useImperativeHandle, useMemo } from 'react';
import { animationFrameScheduler, from, ObservableInput, observeOn } from 'rxjs';
import { useTransitionObservable } from '../hooks/useTransitionObservable';
import { useObservable } from '../hooks/useObservable';
import { useRxEffect } from '../hooks/useRxEffect';
import { markAsRxEffectObservable, RxEffectObservable } from '../internal';

export type Output$Props = RefAttributes<RxEffectObservable> & {
  withTransition?: boolean;
  $: ObservableInput<ReactNode>;
  children?: never;
}

interface Output$ extends CallableFunction {
  displayName: 'Output$';

  (props: Output$Props): ReactElement;
}

export const Output$ = forwardRef<RxEffectObservable, Omit<Output$Props, 'ref'>>((
  { withTransition = false, $: source },
  forwardedRef,
): ReactElement => {
  const observable = useMemo(() => from(source), [source]);
  const [_pending, value] = withTransition ? useTransitionObservable(observable) : [false, useObservable(observable)];
  const effect$ = useRxEffect();

  useImperativeHandle(
    forwardedRef,
    () => markAsRxEffectObservable(effect$.pipe(observeOn(animationFrameScheduler))),
    [],
  );

  return (
    <Fragment>{value}</Fragment>
  );
}) as Output$;

Output$.displayName = 'Output$';
