import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
// jsdom 没有 IndexedDB，给测试环境注入 fake-indexeddb
import 'fake-indexeddb/auto';
// jsdom 也不带 structuredClone，给 fake-indexeddb 注入
if (typeof globalThis.structuredClone !== 'function') {
  (globalThis as { structuredClone: typeof structuredClone }).structuredClone = (val: unknown) => {
    return JSON.parse(JSON.stringify(val));
  };
}

configure({
  testIdAttribute: 'data-testid',
});

declare const global: typeof globalThis;
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
) as jest.Mock;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

(window as any).scrollTo = jest.fn();

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
