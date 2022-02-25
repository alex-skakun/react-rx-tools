import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { BehaviorSubject, Subject } from 'rxjs';
import { useObservable } from './useObservable';


describe('useObservable', () => {
  let wrapper: ReactWrapper;

  afterEach(() => {
    act(() => void wrapper.unmount());
  });

  it('should provide updated value from observable', () => {
    const subject$ = new Subject<number>();
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span>{value ? value : 'none'}</span>;
    };
    wrapper = mount(<TestComponent/>);
    const span = wrapper.find('span');

    expect(span.text()).toBe('none');
    act(() => subject$.next(1));
    expect(span.text()).toBe('1');
  });

  it('should provide initial value from observable and then update it', () => {
    const subject$ = new BehaviorSubject<number>(1);
    const TestComponent = () => {
      const value = useObservable(subject$);
      return <span>{value}</span>;
    };
    wrapper = mount(<TestComponent/>);
    const span = wrapper.find('span');

    expect(span.text()).toBe('1');
    act(() => subject$.next(2));
    expect(span.text()).toBe('2');
  });
});
