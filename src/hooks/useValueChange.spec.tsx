import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, renderHook } from '@testing-library/react';
import { act, useCallback, useState } from 'react';
import { isObservable } from 'rxjs';
import { useSubscription } from './useSubscription';
import { useValueChange } from './useValueChange';

describe('useValueChange()', () => {
  test('returns an observable', () => {
    renderHook(() => {
      const value$ = useValueChange(1);

      expect(isObservable(value$)).toBeTruthy();
    });
  });

  test('emit new values', () => {
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
