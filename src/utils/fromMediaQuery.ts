import { NEVER, Observable } from 'rxjs';
import { multicastForUI } from './multicastForUI';

export function fromMediaQuery(mediaQuery: string): Observable<boolean> {
  if (!('matchMedia' in globalThis)) {
    return NEVER;
  }

  return new Observable<boolean>((subscriber) => {
    const mql = matchMedia(mediaQuery);
    const onChange = ({ matches }: MediaQueryListEvent) => {
      subscriber.next(matches);
    };

    mql.addEventListener('change', onChange);
    subscriber.next(mql.matches);

    return () => {
      mql.removeEventListener('change', onChange);
    };
  }).pipe(
    multicastForUI(),
  );
}
