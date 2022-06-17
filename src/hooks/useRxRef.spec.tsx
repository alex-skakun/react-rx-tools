import { render, renderHook, screen } from '@testing-library/react';
import { Observable } from 'rxjs';
import { useRxRef } from './useRxRef';
import { useSubscription } from './useSubscription';


describe('useRxRef()', () => {

  it('should provide an observable and ref callback', () => {
    renderHook(() => {
      const [ref$, ref] = useRxRef<void>();

      expect(ref$ instanceof Observable).toBeTruthy();
      expect(typeof ref === 'function').toBeTruthy();
    });
  });

  it('should emit ref, when it is available', () => {
    const Test = () => {
      const [ref$, ref] = useRxRef<HTMLDivElement>();

      useSubscription(() => ref$.subscribe((el) => {
        expect(el).toBe(screen.getByTestId('testDiv'));
      }), { immediate: true });

      return <div data-testid="testDiv" ref={ref}>Test</div>;
    };

    render(<Test/>);
  });

  it('should emit ref for late subscriber', () => {
    const Test = () => {
      const [ref$, ref] = useRxRef<HTMLDivElement>();

      useSubscription(() => ref$.subscribe((el) => {
        expect(el).toBe(screen.getByTestId('testDiv'));
      }));

      return <div data-testid="testDiv" ref={ref}>Test</div>;
    };

    render(<Test/>);
  });

});
