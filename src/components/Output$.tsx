import { Fragment, ReactElement, ReactNode, useMemo } from 'react';
import { from, ObservableInput } from 'rxjs';
import { useObservable } from '../hooks/useObservable';


export type OutputObservableProps = {
  $: ObservableInput<ReactNode>;
  children?: never;
}

export function Output$({ $: source }: OutputObservableProps): ReactElement {
  const observable = useMemo(() => from(source), [source]);
  const value = useObservable(observable);

  return (
    <Fragment>{value}</Fragment>
  );
}

Output$.displayName = 'Output$';
