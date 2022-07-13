import { BehaviorSubject, Subject } from 'rxjs';
import { render, act } from '@testing-library/react';
import { Render$ } from './Render$';


describe('<Render$ />', () => {

  it('should render when data is not provided', () => {
    const subject$ = new Subject();
    const TestComponent = () => (
      <Render$ $={subject$}>
        {data => <>
          {expect(data).toBeUndefined()}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
  });

  it('should render when data is null', () => {
    const subject$ = new BehaviorSubject(null);
    const TestComponent = () => (
      <Render$ $={subject$}>
        {data => <>
          {expect(data).toBeNull()}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
  });

  it('should not render when data is null or undefined if definedOnly is used', () => {
    const subject$ = new BehaviorSubject<number | null>(null);
    const observable$ = subject$.asObservable();
    const TestComponent = () => (
      <Render$ $={observable$} definedOnly>
        {data => <>
          {expect(data).toBe(1)}
        </>}
      </Render$>
    );
    render(<TestComponent/>);
    act(() => subject$.next(1));
  });

});
