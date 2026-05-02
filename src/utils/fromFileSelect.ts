import { filter, NEVER, Observable, take } from 'rxjs';
import { isNonEmptyArray, isPresent, OverrideProperties } from 'value-guards';

export interface FileSelectOptions {
  accept?: string;
  multiple?: boolean;
}

export function fromFileSelect(options: OverrideProperties<FileSelectOptions, { multiple: true }>): Observable<File[]>;
export function fromFileSelect(options: OverrideProperties<FileSelectOptions, { multiple: false }>): Observable<File>;
export function fromFileSelect(options: Omit<FileSelectOptions, 'multiple'>): Observable<File>;
export function fromFileSelect(): Observable<File>;

export function fromFileSelect({ accept = '', multiple = false }: FileSelectOptions = {}): Observable<File | File[]> {
  if (!('document' in globalThis)) {
    return NEVER;
  }

  const fileInput = document.createElement('input');

  fileInput.type = 'file';
  fileInput.accept = accept;
  fileInput.multiple = multiple;

  return new Observable<File | File[] | [] | null>((subscriber) => {
    const clearSelection = () => {
      fileInput.value = '';
    };
    const listener = () => {
      subscriber.next(multiple ? [...fileInput.files!] : fileInput.files!.item(0));
    };

    fileInput.addEventListener('change', listener);
    fileInput.addEventListener('click', clearSelection);
    fileInput.dispatchEvent(new MouseEvent('click'));

    return () => {
      fileInput.removeEventListener('change', listener);
      fileInput.removeEventListener('click', clearSelection);
    };
  }).pipe(
    filter(isPresent),
    filter((fileOrArray) => (
      Array.isArray(fileOrArray) ? isNonEmptyArray(fileOrArray) : isPresent(fileOrArray)
    )),
    take(1),
  );
}
