import { fireEvent, render, renderHook } from '@testing-library/react';
import { act, useCallback, useState } from 'react';
import { Observable } from 'rxjs';
import { useSubscription } from './useSubscription';
import { useValueChange } from './useValueChange';
import { describe, expect, it, mock } from 'bun:test';

describe('useValueChange()', () => {

  it('should provide an observable', () => {
    renderHook(() => {
      const value$ = useValueChange(1);

      expect(value$ instanceof Observable).toBeTruthy();
    });
  });

  it('should emit new values', () => {
    const fn = mock();
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

    const { getByTestId } = render(<Test/>);
    expect(fn).toHaveBeenCalledWith(1);
    act(() => {
      fireEvent.click(getByTestId('test'));
    });
    expect(fn).toHaveBeenCalledWith(2);
  });

});
