import { Fragment, ReactElement, ReactNode, useMemo } from 'react';
import { from, ObservableInput } from 'rxjs';
import { isDefined } from 'value-guards';
import { useTransitionObservable } from '../hooks/useTransitionObservable';

export type RenderAsyncDefinedOnlyProps<T> = {
  definedOnly: true;
  $: ObservableInput<T>;
  fallback?: ReactNode;
  children: (value: NonNullable<T>, pending: boolean) => ReactNode;
};

export type RenderAsyncBasicProps<T> = {
  definedOnly?: false;
  $: ObservableInput<T>;
  fallback?: ReactNode;
  children: (value: T | undefined, pending: boolean) => ReactNode;
};

export type RenderAsyncProps<T> = RenderAsyncDefinedOnlyProps<T> | RenderAsyncBasicProps<T>;

export function Render$<T>(props: RenderAsyncBasicProps<T>): ReactElement | null;
export function Render$<T>(props: RenderAsyncDefinedOnlyProps<T>): ReactElement | null;

export function Render$<T>({ $: source, definedOnly, fallback, children }: RenderAsyncProps<T>): ReactElement | null {
  const observable = useMemo(() => from(source), [source]);
  const [pending, value] = useTransitionObservable(observable);

  if (definedOnly) {
    return (
      <Fragment>
        {isDefined(value) ? (children(value, pending) ?? fallback ?? null) : (fallback ?? null)}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        {children(value, pending) ?? fallback ?? null}
      </Fragment>
    );
  }
}

Render$.displayName = 'Render$';
