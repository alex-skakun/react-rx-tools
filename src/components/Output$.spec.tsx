import { describe, expect, mock, test } from 'bun:test';
import { BehaviorSubject, NEVER, of, Subject } from 'rxjs';
import { act, useRef } from 'react';
import { render } from '@testing-library/react';
import { Output$ } from './Output$';
import { isRxEffectObservable, RxEffectObservable, RxEffectRef } from '../internal';

describe('<Output$ />', () => {
  test('render emitted data', () => {
    const obs$ = of('test');
    const TestComponent = () => (
      <div data-testid="container"><Output$ $={obs$}/></div>
    );
    const { getByTestId } = render(<TestComponent/>);

    expect(getByTestId('container')?.textContent).toBe('test');
  });

  test('do not render if observable does not emit on subscribe', () => {
    const obs$ = NEVER;
    const TestComponent = () => (
      <div data-testid="container"><Output$ $={obs$}/></div>
    );
    const { getByTestId } = render(<TestComponent/>);

    expect(getByTestId('container')?.textContent).toBe('');
  });

  test('do not render if observable does not emit on subscribe, but then render after emit', () => {
    const subject = new Subject<string>();
    const TestComponent = () => (
      <div data-testid="container"><Output$ $={subject}/></div>
    );
    const { getByTestId } = render(<TestComponent/>);

    expect(getByTestId('container')?.textContent).toBe('');
    act(() => subject.next('test'));
    expect(getByTestId('container')?.textContent).toBe('test');
  });

  test('render if observable emits on subscribe, and then render after emit', () => {
    const subject = new BehaviorSubject<string>('test');
    const TestComponent = () => (
      <div data-testid="container"><Output$ $={subject}/></div>
    );
    const { getByTestId } = render(<TestComponent/>);

    expect(getByTestId('container')?.textContent).toBe('test');
    act(() => subject.next('success'));
    expect(getByTestId('container')?.textContent).toBe('success');
  });

  test('provide RxEffectObservable in ref', () => {
    const refCallback = mock();
    const obs$ = of('test');
    const TestComponent = () => (
      <div data-testid="container"><Output$ ref={refCallback} $={obs$}/></div>
    );

    render(<TestComponent/>);

    expect(refCallback).toHaveBeenCalledTimes(1);
    expect(isRxEffectObservable(refCallback.mock.calls.at(0)?.at(0))).toBeTrue();
  });
});
