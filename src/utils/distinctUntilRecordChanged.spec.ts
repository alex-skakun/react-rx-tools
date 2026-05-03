import { describe, expect, mock, test } from 'bun:test';
import { from } from 'rxjs';
import { distinctUntilRecordChanged } from './distinctUntilRecordChanged';

describe('distinctUntilRecordChanged()', () => {
  test('distinct records if they are equal', () => {
    const onNext = mock();

    from([
      { value: 1 },
      { value: 1 },
      { value: 1 },
    ])
      .pipe(
        distinctUntilRecordChanged(),
      )
      .subscribe(onNext);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('pass a record if it changed', () => {
    const onNext = mock();

    from([
      { value: 1, key: 'a' },
      { value: 1, key: 'a' },
      { value: 2, key: 'a' },
      { value: 2, key: 'a' },
      { value: 2 },
    ])
      .pipe(
        distinctUntilRecordChanged(),
      )
      .subscribe(onNext);

    expect(onNext).toHaveBeenCalledTimes(3);
  });
});
