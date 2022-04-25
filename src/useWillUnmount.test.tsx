import React from 'react';
import { mount } from 'enzyme';
import useWillUnmount from './useWillUnmount';

describe('useWillUnmount', () => {

  it('should emit before component unmounted', () => {
    const tester = jest.fn();
    const TestComponent = () => {
      const willUnmount$ = useWillUnmount();

      willUnmount$.subscribe(() => tester());

      return <div>Test</div>;
    };
    const wrapper = mount(<TestComponent/>);

    expect(tester).toHaveBeenCalledTimes(0);

    wrapper.unmount();

    expect(tester).toHaveBeenCalledTimes(1);

  });

});
