import { BehaviorSubject, Subject } from 'rxjs';
import { render } from '@testing-library/react';
import { Render$ } from './Render$';
import { describe, expect, it } from 'bun:test';
import { act, Fragment } from 'react';

describe('Render$', () => {
  it('should render when data is not provided', () => {
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

  it('should render when data is null', () => {
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

  it('should not render when data is null or undefined if definedOnly is used', () => {
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

  describe('render fallback when children are not provided', () => {
    it('render fallback while data is not defined', () => {
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

    it('render fallback while data is defined, but there are no children', () => {
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
