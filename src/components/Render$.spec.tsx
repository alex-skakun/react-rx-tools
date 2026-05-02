import { describe, expect, mock, test } from 'bun:test';
import { BehaviorSubject, noop, of, Subject } from 'rxjs';
import { act } from 'react';
import { render } from '@testing-library/react';
import { Render$ } from './Render$';
import { Output$ } from './Output$';
import { isRxEffectObservable } from '../internal';

describe('Render$', () => {
  test('should render when data is not provided', () => {
    const subject$ = new Subject();
    const TestComponent = () => (
      <Render$ $={subject$}>
        {data => <>
          {expect(data).toBeUndefined()}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
  });

  test('should render when data is null', () => {
    const subject$ = new BehaviorSubject(null);
    const TestComponent = () => (
      <Render$ $={subject$}>
        {data => <>
          {expect(data).toBeNull()}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
  });

  test('should not render when data is null or undefined if definedOnly is used', () => {
    const subject$ = new BehaviorSubject<number | null>(null);
    const observable$ = subject$.asObservable();
    const TestComponent = () => (
      <Render$ $={observable$} definedOnly>
        {data => <>
          {expect(data).toBe(1)}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
    act(() => subject$.next(1));
  });

  test('provide RxEffectObservable in ref', () => {
    const refCallback = mock();
    const obs$ = of('test');
    const TestComponent = () => (
      <Render$ ref={refCallback} $={obs$} definedOnly>
        {data => JSON.stringify(data)}
      </Render$>
    );

    render(<TestComponent/>);

    expect(refCallback).toHaveBeenCalledTimes(1);
    expect(isRxEffectObservable(refCallback.mock.calls.at(0)?.at(0))).toBeTrue();
  });

  describe('render fallback when children are not provided', () => {
    test('render fallback while data is not defined', () => {
      const source$ = new Subject<string>();
      const TestComponent = () => (
        <Render$ definedOnly $={source$} fallback={<span data-testid="testEl">none</span>}>
          {(value) => (
            <span data-testid="testEl">{value}</span>
          )}
        </Render$>
      );
      const { getByTestId } = render(<TestComponent/>);

      expect(getByTestId('testEl')?.textContent).toBe('none');
      act(() => source$.next('test'));
      expect(getByTestId('testEl')?.textContent).toBe('test');
    });

    test('render fallback while data is defined, but there are no children', () => {
      const source$ = new Subject<string>();
      const TestComponent = () => (
        <Render$ definedOnly $={source$} fallback={<span data-testid="testEl">none</span>}>
          {() => null}
        </Render$>
      );
      const { getByTestId } = render(<TestComponent/>);

      expect(getByTestId('testEl')?.textContent).toBe('none');
      act(() => source$.next('test'));
      expect(getByTestId('testEl')?.textContent).toBe('none');
    });
  });
});
