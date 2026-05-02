import { describe, expect, mock, test } from 'bun:test';
import { fromTransitionEnd } from './fromTransitionEnd';

describe('fromTransitionEnd()', () => {
  test('emit once when awaited animation happened', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromTransitionEnd(el, 'height').subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('width')));
    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('height')));
    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('height')));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('emit once when awaited animation happened and awaited animations declared as array', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromTransitionEnd(el, ['height', 'block-size']).subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('width')));
    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('block-size')));
    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('height')));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('emit element when animation ended', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromTransitionEnd(el, 'height').subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createTransitionEndEvent('height')));

    expect(onNext).toHaveBeenCalledWith(el);
  });
});

function createTransitionEndEvent(propertyName: string) {
  return Object.assign(
    new TransitionEvent('transitionend', { propertyName }),
    { propertyName },
  )
}
