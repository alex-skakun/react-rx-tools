import React from 'react';
import { mount } from 'enzyme';
import useDidMount from './useDidMount';

describe('useDidMount', () => {

  it('should emit after component mounted', () => {
    const tester = jest.fn();
    const TestComponent = () => {
      const didMount$ = useDidMount();

      didMount$.subscribe(() => tester());

      return <div>Test</div>
    }
    const wrapper = mount(<TestComponent/>);

    expect(tester).toHaveBeenCalled();

    wrapper.unmount();
  });

});
