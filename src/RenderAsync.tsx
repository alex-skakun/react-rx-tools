import { ReactElement, useMemo } from 'react';
import { from, ObservableInput } from 'rxjs';
import { isDefined } from './helpers/isDefined';
import { useObservable } from './useObservable';


type RenderObservableProps<T> = {
  source: ObservableInput<T>;
  definedOnly?: boolean;
  children: (value: T) => ReactElement;
};

export function RenderAsync<T>({ source, definedOnly = false, children }: RenderObservableProps<T>): ReactElement {
  let value$ = useMemo(() => from(source), [source]);
  let value = useObservable(value$);

  return useMemo(() => {
    if (definedOnly) {
      return isDefined(value) && children(value);
    } else {
      return children(value);
    }
  }, [value, definedOnly]);
}
