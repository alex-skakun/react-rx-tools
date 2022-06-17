import { render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { Output$ } from './Output$';


describe('<Output$ />', () => {

  it('should render provided data', () => {
    const subject$ = new BehaviorSubject('test');
    const TestComponent = () => (
      <div><Output$ $={subject$} /></div>
    );
    const { container } = render(<TestComponent/>);

    expect(container.querySelector('div')?.textContent).toBe('test');
  });

});
