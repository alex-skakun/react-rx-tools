import { concat, map, of, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs';
import { ReactElement, ReactNode, useMemo, useRef } from 'react';
import { useOnce } from 'react-cool-hooks';
import { fromTransitionEnd, Render$, RxEffectObservable, useNextRender, useRxRef, useValueChange } from '../src';

export interface AccordionAnimationParams {
  expanding: boolean;
  collapsing: boolean;
  idle: boolean;
}

export type AccordionProps = {
  expanded?: boolean;
  animated?: boolean;
  children: (params: AccordionAnimationParams) => ReactNode;
};

export function Accordion({ expanded = false, animated = true, children }: AccordionProps): ReactElement {
  const expanded$ = useValueChange(expanded);
  const animated$ = useValueChange(animated);
  const [domRef$, domRef] = useRxRef<HTMLDivElement>();
  const renderEffectRef = useRef<RxEffectObservable>(null);
  const fromNextRender = useNextRender(renderEffectRef);

  const state$ = useOnce(() => expanded$.pipe(
    withLatestFrom(
      animated$,
      domRef$.pipe(startWith(null)),
    ),
    switchMap(([isExpanded, isAnimated, container], index) => {
      const height = isExpanded ? 'auto' : '0px';

      if (index === 0 || !isAnimated || !container) {
        return of({ shouldRenderChildren: isExpanded, isExpanded, height });
      }

      return concat(
        of({ shouldRenderChildren: true, isExpanded, height: isExpanded ? '0px' : getPxHeight(container) }),
        concat(
          fromNextRender().pipe(
            map(() => ({ shouldRenderChildren: true, isExpanded, height: isExpanded ? getPxHeight(container) : '0px' })),
          ),
          fromTransitionEnd(container, 'height', 300).pipe(
            map(() => ({ shouldRenderChildren: isExpanded, isExpanded, height })),
          ),
        ),
      );
    }),
    shareReplay(1),
  ))!;

  return useMemo(() => (
    <Render$ definedOnly ref={renderEffectRef} $={state$}>
      {({ isExpanded, shouldRenderChildren, height }) => {
        const expanding = isExpanded && height !== 'auto';
        const collapsing = !isExpanded && shouldRenderChildren;
        const idle = !expanding && !collapsing;

        return (
          <div className="accordion-content" ref={domRef} style={{ height }}>
            {shouldRenderChildren && children({ expanding, collapsing, idle })}
          </div>
        );
      }}
    </Render$>
  ), [children]);
}

function getPxHeight(container: HTMLDivElement): string {
  return `${container.scrollHeight}px`;
}
