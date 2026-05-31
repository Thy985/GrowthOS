import '@testing-library/jest-dom';

declare const global: typeof globalThis;

(global as typeof globalThis).TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < input.length; i++) {
      bytes.push(input.charCodeAt(i));
    }
    return new Uint8Array(bytes);
  }
} as unknown as typeof TextEncoder;

(global as typeof globalThis).TextDecoder = class TextDecoder {
  decode(data: BufferSource | null): string {
    if (data instanceof Uint8Array) {
      return String.fromCharCode.apply(null, Array.from(data));
    }
    return '';
  }
} as unknown as typeof TextDecoder;

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: function<T extends ArrayBufferView | null>(array: T): T {
      for (let i = 0; i < (array as ArrayBufferView).byteLength; i++) {
        (array as Uint8Array)[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      deriveKey: async () => ({}),
      encrypt: async () => new ArrayBuffer(0),
      decrypt: async () => new ArrayBuffer(0),
      exportKey: async () => new ArrayBuffer(0),
      importKey: async () => ({}),
      digest: async () => new ArrayBuffer(0),
    },
    webcrypto: {
      getRandomValues: (global as typeof globalThis).crypto.getRandomValues,
      subtle: (global as typeof globalThis).crypto.subtle,
    },
  },
  writable: true,
});

const originalBtoa = (str: string): string => {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return btoa(String.fromCharCode.apply(null, bytes));
};

const originalAtob = (str: string): string => {
  const binary = atob(str);
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i++) {
    bytes.push(binary.charCodeAt(i));
  }
  return String.fromCharCode.apply(null, bytes);
};

(global as Record<string, unknown>).btoa = originalBtoa;
(global as Record<string, unknown>).atob = originalAtob;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));
