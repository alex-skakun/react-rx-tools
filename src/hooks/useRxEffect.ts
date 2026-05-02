import { useEffect } from 'react';
import { useOnce } from 'react-cool-hooks';
import { BehaviorSubject, connectable, Subject } from 'rxjs';
import { useSubject } from './useSubject';
import { useSubscription } from './useSubscription';
import { markAsRxEffectObservable, RxEffectObservable } from '../internal';

export function useRxEffect(): RxEffectObservable {
  const subject = useSubject(() => new BehaviorSubject<number>(0));
  const effect$ = useOnce(() => markAsRxEffectObservable(connectable(subject, {
    connector: () => new Subject(),
    resetOnDisconnect: true,
  })));

  useSubscription(() => effect$.connect(), { immediate: true });

  useEffect(() => {
    subject.next(subject.getValue() + 1);
  });

  return effect$;
}
