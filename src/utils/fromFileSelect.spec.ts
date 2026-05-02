import { describe, expect, mock, spyOn, test } from 'bun:test';
import { fromFileSelect } from './fromFileSelect';

describe('fromFileSelect()', () => {
  test('single file', () => {
    const onNext = mock();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.createElement('input');
    const files = createFileList(file);
    spyOn(document, 'createElement').mockReturnValue(fileInput);

    fromFileSelect().subscribe(onNext);

    triggerFileChange(fileInput, files);

    expect(onNext).toHaveBeenCalledWith(file);
  });

  test('multiple files', () => {
    const onNext = mock();
    const file1 = new File(['test1'], 'test.txt', { type: 'text/plain' });
    const file2 = new File(['test2'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.createElement('input');
    const files = createFileList(file1, file2);
    spyOn(document, 'createElement').mockReturnValue(fileInput);

    fromFileSelect({ multiple: true }).subscribe(onNext);

    triggerFileChange(fileInput, files);

    expect(onNext).toHaveBeenCalledWith([file1, file2]);
  });
});

function createFileList(...files: File[]): FileList {
  return Object.assign(
    files,
    {
      item(this: Array<File>, index: number) {
        return this.at(index);
      },
    },
  ) as FileList;
}

function triggerFileChange(fileInput: HTMLInputElement, files: FileList): void {
  Object.assign(fileInput, { files });
  fileInput.dispatchEvent(new Event('change'));
}
