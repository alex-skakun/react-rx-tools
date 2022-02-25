import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { BehaviorSubject, Subject } from 'rxjs';
import { RenderAsync } from './RenderAsync';


describe('RenderAsync', () => {
  let wrapper: ReactWrapper;

  afterEach(() => {
    act(() => void wrapper.unmount());
  });

  it('should render when data is not provided', () => {
    const subject$ = new Subject();
    const TestComponent = () => (
      <RenderAsync source={subject$}>
        { data => <>
          { expect(data).toBeUndefined() }
        </> }
      </RenderAsync>
    );
    wrapper = mount(<TestComponent />);
  });

  it('should render when data is null', () => {
    const subject$ = new BehaviorSubject(null);
    const TestComponent = () => (
      <RenderAsync source={subject$}>
        { data => <>
          { expect(data).toBeNull() }
        </> }
      </RenderAsync>
    );
    wrapper = mount(<TestComponent />);
  });

  it('should not render when data is null or undefined if definedOnly is used', () => {
    const subject$ = new BehaviorSubject<number>(null);
    const TestComponent = () => (
      <RenderAsync source={subject$} definedOnly>
        { data => <>
          { expect(data).toBe(1) }
        </> }
      </RenderAsync>
    );
    wrapper = mount(<TestComponent />);
    act(() => subject$.next(1));
  });
});
