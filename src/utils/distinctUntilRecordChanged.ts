import { distinctUntilChanged, OperatorFunction, pipe } from 'rxjs';
import { objectEntries } from 'react-cool-utils';

export function distinctUntilRecordChanged<T extends object>(): OperatorFunction<T, T> {
  return pipe(
    distinctUntilChanged((previous, current): boolean => {
      for (const [property, value] of objectEntries(current)) {
        if (!Object.is(value, previous[property as keyof T])) {
          return false;
        }
      }

      return true;
    }),
  );
}
