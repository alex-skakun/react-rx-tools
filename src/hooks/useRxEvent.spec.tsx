import { fireEvent, render, renderHook } from '@testing-library/react';
import { act, MouseEvent } from 'react';
import { Observable, skip, take } from 'rxjs';
import { useRxEvent } from './useRxEvent';
import { useSubscription } from './useSubscription';
import { describe, expect, it } from 'bun:test';

describe('useRxEvent()', () => {

  it('should provide an observable and event listener callback', () => {
    renderHook(() => {
      const [event$, onEvent] = useRxEvent();

      expect(event$ instanceof Observable).toBeTruthy();
      expect(typeof onEvent === 'function').toBeTruthy();
    });
  });

  it('should emit when event happens', () => {
    const Test = () => {
      const [click$, onClick] = useRxEvent<MouseEvent>();

      useSubscription(() => click$.subscribe((event) => {
        expect(event.type).toBe('click');
      }));

      return <button data-testid="test" type="button" onClick={onClick}>Click</button>;
    };

    const { getByTestId } = render(<Test/>);

    act(() => {
      fireEvent.click(getByTestId('test'));
    });
  });

  it('should transform event to event type', () => {
    const Test = () => {
      const [click$, onClick] = useRxEvent<MouseEvent, string>((event) => event.type);

      useSubscription(() => click$.subscribe((type) => {
        expect(type).toBe('click');
      }));

      return <button data-testid="test" type="button" onClick={onClick}>Click</button>;
    };

    const { getByTestId } = render(<Test/>);

    act(() => {
      fireEvent.click(getByTestId('test'));
    });
  });

  it('should transform event using updated props', () => {
    const Test = ({ p1 }: { p1: string }) => {
      const [click$, onClick] = useRxEvent<MouseEvent, string>(() => p1);

      useSubscription(() => click$.pipe(take(1)).subscribe((value) => {
        expect(value).toBe('firstValue');
      }));

      useSubscription(() => click$.pipe(skip(1)).subscribe((value) => {
        expect(value).toBe('secondValue');
      }));

      return <button data-testid="test" type="button" onClick={onClick}>Click</button>;
    };

    const { rerender, getByTestId } = render(<Test p1="firstValue"/>);

    act(() => {
      fireEvent.click(getByTestId('test'));
    });

    rerender(<Test p1="secondValue"/>);

    act(() => {
      fireEvent.click(getByTestId('test'));
    });
  });

});
