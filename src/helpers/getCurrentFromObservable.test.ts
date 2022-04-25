import { BehaviorSubject, ReplaySubject, startWith, Subject } from 'rxjs';
import getCurrentFromObservable from './getCurrentFromObservable';


describe('getCurrentFromObservable()', () => {

  it('should return undefined for Subject', () => {
    const subject$ = new Subject();

    expect(getCurrentFromObservable(subject$)).toBeUndefined();
  });

  it('should return value for BehaviorSubject', () => {
    const subject$ = new BehaviorSubject<string>('test');

    expect(getCurrentFromObservable(subject$)).toBe('test');
  });

  it('should return value for ReplaySubject', () => {
    const subject$ = new ReplaySubject<string>(1);

    subject$.next('test');
    expect(getCurrentFromObservable(subject$)).toBe('test');
  });

  it('should return value for observable that has a value', () => {
    const subject$ = new Subject<string>();
    const observable$ = subject$.pipe(startWith('test'));

    expect(getCurrentFromObservable(observable$)).toBe('test');
  });
});
