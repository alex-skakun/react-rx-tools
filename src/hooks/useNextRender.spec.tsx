import { describe, expect, test } from 'bun:test';
import { render, renderHook } from '@testing-library/react';
import { useOnce } from 'react-cool-hooks';
import { concat, map, of } from 'rxjs';
import { useRef } from 'react';
import { RxEffectObservable, RxEffectRef } from '../internal';
import { Render$ } from '../components/Render$';
import { useNextRender } from './useNextRender';
import { useRxEffect } from './useRxEffect';
import { ComboRef, useRxRef } from './useRxRef';
import { useObservable } from './useObservable';

describe('useNextRender()', () => {
  test('returns function', () => {
    const { result } = renderHook(() => {
      const rxEffect$ = useRxEffect();
      return useNextRender(rxEffect$);
    });

    expect(result.current).toBeFunction();
  });

  describe('creates an observable which emits after render', () => {
    test('basic ref passed', async () => {
      const Component = () => {
        const rxEffectRef = useRef<RxEffectObservable>(null);
        const fromNextRender = useNextRender(rxEffectRef);
        const values$ = useOnce(() => concat(
          of('test-1'),
          fromNextRender().pipe(
            map(() => 'test-2'),
          ),
        ));

        return (
          <Render$ ref={rxEffectRef} $={values$}>
            {(text) => (
              <span data-testid="container">{text}</span>
            )}
          </Render$>
        );
      };
      const { getByTestId } = render(<Component/>);

      expect(getByTestId('container')?.textContent).toBe('test-1');
      await Bun.sleep(1);
      expect(getByTestId('container')?.textContent).toBe('test-2');
    });
  });

  test('rxRef passed', async () => {
    const Component = () => {
      const [_, rxEffectRef] = useRxRef<RxEffectObservable>();
      const fromNextRender = useNextRender(rxEffectRef);
      const values$ = useOnce(() => concat(
        of('test-1'),
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <Render$ ref={rxEffectRef} $={values$}>
          {(text) => (
            <span data-testid="container">{text}</span>
          )}
        </Render$>
      );
    };
    const { getByTestId } = render(<Component/>);

    expect(getByTestId('container')?.textContent).toBe('test-1');
    await Bun.sleep(1);
    expect(getByTestId('container')?.textContent).toBe('test-2');
  });

  test('RxEffectObservable passed', async () => {
    const Component = () => {
      const rxEffect$ = useRxEffect();
      const fromNextRender = useNextRender(rxEffect$);
      const text = useObservable(() => concat(
        of('test-1'),
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <span data-testid="container">{text}</span>
      );
    };
    const { getByTestId } = render(<Component/>);

    expect(getByTestId('container')?.textContent).toBe('test-1');
    await Bun.sleep(1);
    expect(getByTestId('container')?.textContent).toBe('test-2');
  });

  test('there are no arguments passed', async () => {
    const Component = () => {
      const fromNextRender = useNextRender();
      const text = useObservable(() => concat(
        of('test-1'),
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <span data-testid="container">{text}</span>
      );
    };
    const { getByTestId } = render(<Component/>);

    expect(getByTestId('container')?.textContent).toBe('test-1');
    await Bun.sleep(1);
    expect(getByTestId('container')?.textContent).toBe('test-2');
  });

  test('throw error when wrong observable passed', async () => {
    const Component = () => {
      const fromNextRender = useNextRender(of(1) as RxEffectObservable);
      const text = useObservable(() => concat(
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <span data-testid="container">{text}</span>
      );
    };

    expect(() => render(<Component/>)).toThrowError('useNextRender(): received observable is not RxEffectObservable');
  });

  test('throw error when wrong ref object passed', async () => {
    const Component = () => {
      const ref = useRef(of(1));
      const fromNextRender = useNextRender(ref as RxEffectRef);
      const text = useObservable(() => concat(
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <span data-testid="container">{text}</span>
      );
    };

    expect(() => render(<Component/>)).toThrowError('useNextRender(): received observable is not RxEffectObservable');
  });

  test('throw error when wrong rxRef object passed', async () => {
    const Component = () => {
      const [, ref] = useRxRef(of(1));
      const fromNextRender = useNextRender(ref as unknown as ComboRef<RxEffectObservable>);
      const text = useObservable(() => concat(
        fromNextRender().pipe(
          map(() => 'test-2'),
        ),
      ));

      return (
        <span data-testid="container">{text}</span>
      );
    };

    expect(() => render(<Component/>)).toThrowError('useNextRender(): received observable is not RxEffectObservable');
  });
});
