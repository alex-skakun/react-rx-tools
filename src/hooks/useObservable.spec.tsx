import { describe, expect, it, mock } from 'bun:test';
import { act, Fragment } from 'react';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { render, renderHook } from '@testing-library/react';
import { useObservable } from './useObservable';

describe('useObservable()', () => {
  it('should provide updated value from observable', () => {
    const subject$ = new Subject<number>();
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span data-testid="valueContainer">{value ? value : 'none'}</span>;
    };
    const { container } = render(<TestComponent/>);
    const span = container.querySelector('[data-testid="valueContainer"]');

    expect(span?.textContent).toBe('none');
    act(() => subject$.next(1));
    expect(span?.textContent).toBe('1');
  });

  it('should provide latest value if observable emits many times on subscribe', () => {
    const subject$ = new ReplaySubject<number>();
    subject$.next(1);
    subject$.next(2);
    subject$.next(3);

    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span data-testid="valueContainer">{value ? value : 'none'}</span>;
    };

    const { container } = render(<TestComponent/>);
    const span = container.querySelector('[data-testid="valueContainer"]');

    expect(span?.textContent).toBe('3');
  });

  it('update state after mount if there were additional event after initial result', async () => {
    let renderCounter = 0;
    const subject$ = new ReplaySubject<number>();
    subject$.next(1);
    subject$.next(2);
    subject$.next(3);

    queueMicrotask(() => {
      act(() => {
        subject$.next(4);
        subject$.next(5);
        subject$.next(6);
      });
    });

    const { result } = renderHook(() => {
      renderCounter++;
      const value = useObservable(subject$);

      if (renderCounter === 1) {
        expect(value).toBe(3);
      }

      if (renderCounter === 2) {
        expect(value).toBe(6);
      }

      return value;
    });

    expect(result.current).toBe(3);
    await Promise.resolve();
    expect(result.current).toBe(6);
  });

  it('should provide initial value from observable and then update it', () => {
    const subject$ = new BehaviorSubject<number>(1);
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span data-testid="valueContainer">{value}</span>;
    };
    const { container } = render(<TestComponent/>);
    const span = container.querySelector('[data-testid="valueContainer"]');

    expect(span?.textContent).toBe('1');
    act(() => subject$.next(2));
    expect(span?.textContent).toBe('2');
  });

  it('should subscribe after mounting', () => {
    const fn = mock();
    const observable$ = new Observable<string>(fn);
    const TestComponent = () => {
      const value = useObservable(observable$);
      return <span>{value}</span>;
    };
    render(<TestComponent/>);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe after unmounting', () => {
    const fn = mock();
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

  it('create observable from factory only once', () => {
    const fn = mock(() => new Subject());
    const TestComponent = () => {
      useObservable(fn);
      return <Fragment/>;
    };
    const { rerender } = render(<TestComponent/>);

    rerender(<TestComponent/>)

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
