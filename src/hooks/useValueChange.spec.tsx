import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { Observable } from 'rxjs';
import { useSubscription } from './useSubscription';
import { useValueChange } from './useValueChange';


describe('useValueChange()', () => {

  it('should provide an observable', () => {
    renderHook(() => {
      const value$ = useValueChange(1);

      expect(value$ instanceof Observable).toBeTruthy();
    });
  });

  it('should emit new values', () => {
    const fn = jest.fn();
    const Test = () => {
      const [value, setValue] = useState(1);
      const value$ = useValueChange(value);
      const onClick = useCallback(() => {
        setValue(2);
      }, []);

      useSubscription(() => value$.subscribe((val) => {
        fn(val);
      }));

      return <button data-testid="test" type="button" onClick={onClick}>Click</button>;
    };

    render(<Test/>);
    expect(fn).toHaveBeenCalledWith(1);
    act(() => {
      fireEvent.click(screen.getByTestId('test'));
    });
    expect(fn).toHaveBeenCalledWith(2);
  });

});
