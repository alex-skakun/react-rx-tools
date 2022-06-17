import { ReactElement, ReactNode } from 'react';
import { from, ObservableInput } from 'rxjs';
import { useObservable } from '../hooks/useObservable';


interface OutputObservableProps {
  $: ObservableInput<ReactNode>;
  children?: never;
}

export function Output$({ $: source }: OutputObservableProps): ReactElement {
  const value = useObservable(() => from(source));

  return <>{value}</>;
}


