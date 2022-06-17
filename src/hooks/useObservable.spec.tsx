import { act, render, screen } from '@testing-library/react';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { useObservable } from './useObservable';


describe('useObservable()', () => {

  it('should provide updated value from observable', () => {
    const subject$ = new Subject<number>();
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span data-testid="valueContainer">{value ? value : 'none'}</span>;
    };
    render(<TestComponent/>);
    const span = screen.getByTestId('valueContainer');

    expect(span.textContent).toBe('none');
    act(() => subject$.next(1));
    expect(span.textContent).toBe('1');
  });

  it('should provide initial value from observable and then update it', () => {
    const subject$ = new BehaviorSubject<number>(1);
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span data-testid="valueContainer">{value}</span>;
    };
    render(<TestComponent/>);
    const span = screen.getByTestId('valueContainer');

    expect(span.textContent).toBe('1');
    act(() => subject$.next(2));
    expect(span.textContent).toBe('2');
  });

  it('should subscribe after mounting', () => {
    const fn = jest.fn();
    const observable$ = new Observable<string>(fn);
    const TestComponent = () => {
      const value = useObservable(observable$);
      return <span>{value}</span>;
    };
    render(<TestComponent/>);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe after unmounting', () => {
    const fn = jest.fn();
    const observable$ = new Observable<string>(() => {
      return fn;
    });
    const TestComponent = () => {
      const value = useObservable(observable$);
      return <span>{value}</span>;
    };
    const container = render(<TestComponent/>);
    container.unmount();

    expect(fn).toHaveBeenCalledTimes(1);
  });

});
