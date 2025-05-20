import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

GlobalRegistrator.register();
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  cleanup();
});
