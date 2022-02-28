import { ReactElement, ReactNode, useMemo } from 'react';
import { from, ObservableInput } from 'rxjs';
import { isDefined } from './helpers/isDefined';
import { useObservable } from './useObservable';


type RenderAsyncDefinedOnlyProps<T> = {
  source: ObservableInput<T>;
  definedOnly: true;
  children: (value: NonNullable<T>) => ReactNode;
};

type RenderAsyncBasicProps<T> = {
  source: ObservableInput<T>;
  definedOnly?: false;
  children: (value: T | undefined) => ReactNode;
};

type RenderAsyncProps<T> = RenderAsyncDefinedOnlyProps<T> | RenderAsyncBasicProps<T>;

export function RenderAsync<T>(props: RenderAsyncBasicProps<T>): ReactElement | null;
export function RenderAsync<T>(props: RenderAsyncDefinedOnlyProps<T>): ReactElement | null;

export function RenderAsync<T>({ source, definedOnly, children }: RenderAsyncProps<T>): ReactElement | null {
  let value$ = useMemo(() => from(source), [source]);
  let value = useObservable(value$);

  return useMemo(() => {
    if (definedOnly) {
      return isDefined(value) ? (children(value) ?? null) : null;
    } else {
      return children(value as NonNullable<T>) ?? null;
    }
  }, [value, definedOnly]) as ReactElement | null;
}
