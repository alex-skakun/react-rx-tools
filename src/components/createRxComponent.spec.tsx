import { describe, expect, test } from 'bun:test';
import { createRxComponent } from './createRxComponent';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { isValidElement } from 'react';
import { render } from '@testing-library/react';

describe('createRxComponent', () => {
  test('creates new component', () => {
    const Component = createRxComponent((props$) => props$.pipe(
      map(() => 'test'),
    ));

    expect(isValidElement(<Component/>)).toBeTrue();
  });

  test('default displayName equals to "RxComponent"', () => {
    const TestComponent = createRxComponent(() => of('test'));

    expect(TestComponent.displayName).toBe('RxComponent');
  });

  test('specify displayName', () => {
    const TestComponent = createRxComponent(() => of('test'), { name: 'TestComponent' });

    expect(TestComponent.displayName).toBe('TestComponent');
  });

  test('render value from observable', () => {
    const obs$ = of('test');
    const Component = createRxComponent(() => obs$);
    const { container } = render(<Component/>);

    expect(container.textContent).toBe('test');
  });

  test('automatically resubscribe on error', () => {
    const errorRef = { used: false };
    const obs$ = of(null).pipe(
      switchMap(() => (
        errorRef.used
          ? of('success')
          : throwError(() => new Error('failure')).pipe(
            catchError((err) => {
              errorRef.used = true;
              return throwError(() => err);
            })
          )
      )),
    );
    const Component = createRxComponent(() => obs$);
    const { container } = render(<Component/>);

    expect(container.textContent).toBe('success');
  });
});
