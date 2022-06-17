import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { MouseEvent } from 'react';
import { Observable } from 'rxjs';
import { useRxEvent } from './useRxEvent';
import { useSubscription } from './useSubscription';


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

    render(<Test/>);

    act(() => {
      fireEvent.click(screen.getByTestId('test'));
    });
  });

});
