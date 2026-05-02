import { forwardRef, PropsWithoutRef, ReactElement, ReactNode, RefAttributes, useMemo } from 'react';
import { catchError, defer, Observable } from 'rxjs';
import { useOnce } from 'react-cool-hooks';
import { useValueChange } from '../hooks/useValueChange';
import { Output$ } from './Output$';
import { RxEffectObservable } from '../internal';

export interface RxComponentOptions {
  withTransition?: boolean;
  name?: string;
}

export interface RxComponent<Props extends object> extends CallableFunction {
  (props: PropsWithoutRef<Props> & RefAttributes<RxEffectObservable>): ReactElement;

  displayName: string;
}

export function createRxComponent<Props extends object>(
  jsxFactory: (props: Observable<PropsWithoutRef<Props>>) => Observable<ReactNode>,
  { withTransition = false, name }: RxComponentOptions = {},
): RxComponent<Props> {
  const Component = forwardRef<RxEffectObservable, Props>((props, forwardedRef) => {
    const props$ = useValueChange(props);
    const jsx$ = useOnce(() => defer(() => jsxFactory(props$)).pipe(
      catchError((_error, retry$) => {

        return retry$;
      }),
    ));

    return useMemo(() => (
      <Output$ ref={forwardedRef} withTransition={withTransition} $={jsx$}/>
    ), [forwardedRef]);
  }) as RxComponent<Props>;

  Component.displayName = name || 'RxComponent';

  return Component;
}
