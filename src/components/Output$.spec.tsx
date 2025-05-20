import {render } from '@testing-library/react';
import { act } from 'react';
import { BehaviorSubject, NEVER, of, Subject } from 'rxjs';
import { Output$ } from './Output$';
import { describe, expect, it } from 'bun:test';


describe('<Output$ />', () => {

  it('should render provided data', () => {
    const obs$ = of('test');
    const TestComponent = () => (
      <div><Output$ $={obs$}/></div>
    );
    const { container } = render(<TestComponent/>);

    expect(container.querySelector('div')?.textContent).toBe('test');
  });

  it('should not render if observable does not emit on subscribe', () => {
    const obs$ = NEVER;
    const TestComponent = () => (
      <div><Output$ $={obs$}/></div>
    );
    const { container } = render(<TestComponent/>);

    expect(container.querySelector('div')?.textContent).toBe('');
  });

  it('should not render if observable does not emit on subscribe, but then render after emit', () => {
    const subject = new Subject<string>();
    const TestComponent = () => (
      <div><Output$ $={subject}/></div>
    );
    const { container } = render(<TestComponent/>);

    expect(container.querySelector('div')?.textContent).toBe('');

    act(() => subject.next('test'));

    expect(container.querySelector('div')?.textContent).toBe('test');
  });

  it('should render if observable emits on subscribe, and then render after emit', () => {
    const subject = new BehaviorSubject<string>('test');
    const TestComponent = () => (
      <div><Output$ $={subject}/></div>
    );
    const { container } = render(<TestComponent/>);

    expect(container.querySelector('div')?.textContent).toBe('test');

    act(() => subject.next('success'));

    expect(container.querySelector('div')?.textContent).toBe('success');
  });

});
