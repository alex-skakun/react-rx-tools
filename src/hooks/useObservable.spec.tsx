import { describe, expect, mock, test } from 'bun:test';
import { act, Fragment } from 'react';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { render, renderHook } from '@testing-library/react';
import { useObservable } from './useObservable';

describe('useObservable()', () => {
  test('provide updated value from observable', () => {
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

  test('provide latest value if observable emits many times on subscribe', () => {
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

  test('update state after mount if there were additional events after initial result', async () => {
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

  test('return cached value if source observable does not emit new events and component rerenders', () => {
    const subject1$ = new BehaviorSubject<string>('test');

    const { result, rerender } = renderHook(() => {
      return useObservable(subject1$);
    });

    expect(result.current).toEqual('test');
    act(() => rerender());
    expect(result.current).toEqual('test');
  });

  test('return cached value if source observable does not emit new events and another hook triggers render', () => {
    const subject1$ = new BehaviorSubject<string>('test');
    const subject2$ = new BehaviorSubject<number>(1);

    const { result } = renderHook(() => {
      const r1 = useObservable(subject1$);
      const r2 = useObservable(subject2$);

      return { r1, r2 } as const;
    });

    expect(result.current).toEqual({ r1: 'test', r2: 1 });
    act(() => subject2$.next(2));
    expect(result.current).toEqual({ r1: 'test', r2: 2 });
  });

  test('provide initial value from observable and then update it', () => {
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

  test('subscribe after mounting', () => {
    const fn = mock();
    const observable$ = new Observable<string>(fn);
    const TestComponent = () => {
      const value = useObservable(observable$);
      return <span>{value}</span>;
    };
    render(<TestComponent/>);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('unsubscribe after unmounting', () => {
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

  test('create observable from factory only once, if there is no dependencies', () => {
    const fn = mock(() => new Subject());
    const TestComponent = () => {
      useObservable(fn);
      return <Fragment/>;
    };
    const { rerender } = render(<TestComponent/>);

    rerender(<TestComponent/>);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('create observable from factory only once, if empty dependencies passed', () => {
    const fn = mock(() => new Subject());
    const TestComponent = () => {
      useObservable(fn, []);
      return <Fragment/>;
    };
    const { rerender } = render(<TestComponent/>);

    rerender(<TestComponent/>);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('recreate observable from factory, if dependencies change', () => {
    const fn = mock(() => new Subject());
    const TestComponent = ({ value }: { value: number }) => {
      useObservable(fn, [value]);
      return <Fragment/>;
    };
    const { rerender } = render(<TestComponent value={1}/>);

    rerender(<TestComponent value={2}/>);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('throw error for unsupported set of arguments', () => {
    expect(() => renderHook(() => (
      useObservable(null as unknown as Observable<any>)
    ))).toThrowError('useObservable(): Unsupported set of arguments');
  });

  test('throw error when factory returns something else than Observable', () => {
    expect(() => renderHook(() => (
      useObservable(() => ({}) as unknown as Observable<any>)
    ))).toThrowError('useObservable(): Observable finished with error');
  });
});
