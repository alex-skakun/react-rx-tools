import { describe, expect, mock, test } from 'bun:test';
import { fromAnimationEnd } from './fromAnimationEnd';

describe('fromAnimationEnd()', () => {
  test('emit once when awaited animation happened', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromAnimationEnd(el, 'test-animation').subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('other-animation')));
    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('test-animation')));
    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('test-animation')));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('emit once when awaited animation happened and awaited animations declared as array', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromAnimationEnd(el, ['test-animation', 'spec-animation']).subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('other-animation')));
    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('spec-animation')));
    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('test-animation')));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('emit element when animation ended', async () => {
    const el = document.createElement('div');
    const onNext = mock();

    fromAnimationEnd(el, 'test-animation').subscribe(onNext);

    await asyncAction(() => el.dispatchEvent(createAnimationEndEvent('test-animation')));

    expect(onNext).toHaveBeenCalledWith(el);
  });
});

function createAnimationEndEvent(animationName: string) {
  return Object.assign(
    new AnimationEvent('animationend', { animationName }),
    { animationName },
  )
}
