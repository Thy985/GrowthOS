import '@testing-library/jest-dom';

global.TextEncoder = class TextEncoder {
  encode(input) {
    const bytes = [];
    for (let i = 0; i < input.length; i++) {
      bytes.push(input.charCodeAt(i));
    }
    return new Uint8Array(bytes);
  }
};

global.TextDecoder = class TextDecoder {
  decode(data) {
    if (data instanceof Uint8Array) {
      return String.fromCharCode.apply(null, data);
    }
    return '';
  }
};

global.crypto = {
  getRandomValues: function(array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    deriveKey: async () => ({}),
    encrypt: async () => new ArrayBuffer(0),
    decrypt: async () => new ArrayBuffer(0),
    exportKey: async () => new ArrayBuffer(0),
    importKey: async () => ({}),
    digest: async () => new ArrayBuffer(0)
  }
};

global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
