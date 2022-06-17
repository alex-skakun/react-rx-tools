import { ReactElement, ReactNode } from 'react';
import { from, ObservableInput } from 'rxjs';
import isDefined from '../helpers/isDefined';
import { useObservable } from '../hooks/useObservable';


type RenderAsyncDefinedOnlyProps<T> = {
  $: ObservableInput<T>;
  definedOnly: true;
  children: (value: NonNullable<T>) => ReactNode;
};

type RenderAsyncBasicProps<T> = {
  $: ObservableInput<T>;
  definedOnly?: false;
  children: (value: T | undefined) => ReactNode;
};

type RenderAsyncProps<T> = RenderAsyncDefinedOnlyProps<T> | RenderAsyncBasicProps<T>;

export function Render$<T>(props: RenderAsyncBasicProps<T>): ReactElement | null;
export function Render$<T>(props: RenderAsyncDefinedOnlyProps<T>): ReactElement | null;
export function Render$<T>({ $: source, definedOnly, children }: RenderAsyncProps<T>): ReactElement | null {
  const value = useObservable(() => from(source));

  if (definedOnly) {
    return ((isDefined(value) && children(value)) ?? null) as ReactElement | null;
  } else if (children) {
    return (children(value) ?? null) as ReactElement | null;
  } else {
    return null;
  }
}
