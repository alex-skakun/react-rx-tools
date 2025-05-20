import {Observable, OperatorFunction, share, Subject} from "rxjs";
import {useSubject} from "./useSubject";
import {useFunction, useOnce} from "react-cool-hooks";
import {isFunction} from "value-guards";

export interface RxCallback<Args extends any[]> extends CallableFunction {
  (...args: Args): void;
}

export type PipeFactory<Args extends any[], Result> = () => OperatorFunction<Args, Result>;

export function useRxCallback<Args extends any[], Result>(pipe: PipeFactory<Args, Result>): [Observable<Result>, RxCallback<Args>];
export function useRxCallback<Args extends any[]>(): [Observable<Args>, RxCallback<Args>];
export function useRxCallback<Args extends any[], Result = Args>(pipe?: PipeFactory<Args, Result>): [Observable<Result>, RxCallback<Args>] {
  const subject = useSubject(() => new Subject<Args>());
  const callback = useFunction<RxCallback<Args>>((...args) => subject.next(args));
  const result$ = useOnce(() => {
    const operators = isFunction(pipe)
      ? [pipe(), share({ connector: () => new Subject<Result>() })]
      : [];

    return subject.asObservable().pipe(...operators as [OperatorFunction<Args, Result>]);
  });

  return [result$, callback];
}
