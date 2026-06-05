import { describe, it, expect, beforeEach, vi } from 'vitest';

import encryption from '../../shared/utils/encryption.ts';
import secureStorage, {
  secureStorage as namedSecureStorage,
} from '../../shared/utils/secureStorage.ts';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('setItem and getItem round-trip an object', () => {
    const value = { a: 1, b: 'x' };
    const ok = secureStorage.setItem('test', value);
    expect(ok).toBe(true);
    const got = secureStorage.getItem<typeof value>('test');
    expect(got).toEqual(value);
  });

  it('setItem and getItem round-trip a primitive string', () => {
    secureStorage.setItem('test', 'hello');
    const got = secureStorage.getItem<string>('test');
    expect(got).toBe('hello');
  });

  it('getItem returns defaultValue when key is missing', () => {
    const got = secureStorage.getItem<{ x: number }>('missing', { x: 99 });
    expect(got).toEqual({ x: 99 });
  });

  it('getItem returns null when key is missing and no defaultValue', () => {
    expect(secureStorage.getItem('missing')).toBeNull();
  });

  it('removeItem removes the key', () => {
    secureStorage.setItem('test', 'value');
    const ok = secureStorage.removeItem('test');
    expect(ok).toBe(true);
    expect(secureStorage.getItem('test')).toBeNull();
  });

  it('clear removes all keys with app prefixes', () => {
    secureStorage.setItem('growth-records', 1);
    secureStorage.setItem('auth-user', 2);
    secureStorage.setItem('theme', 3);
    // This key should NOT be cleared (doesn't match any app prefix)
    secureStorage.setItem('other-key', 4);
    const ok = secureStorage.clear();
    expect(ok).toBe(true);
    expect(secureStorage.getItem('growth-records')).toBeNull();
    expect(secureStorage.getItem('auth-user')).toBeNull();
    expect(secureStorage.getItem('theme')).toBeNull();
    // Keys not matching app prefixes should remain
    expect(secureStorage.getItem('other-key')).toBe(4);
  });

  it('setItem returns false when encryption returns null', () => {
    const spy = vi.spyOn(encryption, 'encrypt').mockReturnValueOnce(null);
    const ok = secureStorage.setItem('test', 'value');
    expect(spy).toHaveBeenCalled();
    expect(ok).toBe(false);
  });

  it('getItem returns defaultValue when decryption returns null', () => {
    localStorage.setItem('test', 'some-encrypted-value');
    const spy = vi.spyOn(encryption, 'decrypt').mockReturnValueOnce(null);
    const got = secureStorage.getItem('test', 'fallback');
    expect(spy).toHaveBeenCalled();
    expect(got).toBe('fallback');
  });

  it('setItem returns false when localStorage.setItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    const ok = secureStorage.setItem('test', 'value');
    expect(spy).toHaveBeenCalled();
    expect(ok).toBe(false);
  });

  it('removeItem returns false when localStorage.removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('error');
    });
    const ok = secureStorage.removeItem('test');
    expect(ok).toBe(false);
  });

  it('clear returns false when localStorage.key throws', () => {
    secureStorage.setItem('growth-test', 1);
    vi.spyOn(Storage.prototype, 'key').mockImplementationOnce(() => {
      throw new Error('error');
    });
    const ok = secureStorage.clear();
    expect(ok).toBe(false);
  });

  it('named export is the same singleton as default export', () => {
    expect(namedSecureStorage).toBe(secureStorage);
  });

  it('disables encryption: stores plain JSON string and parses on get', () => {
    secureStorage.setEncryptionEnabled(false);
    const value = { foo: 'bar' };
    secureStorage.setItem('plain', value);
    expect(localStorage.getItem('plain')).toBe(JSON.stringify(value));
    expect(secureStorage.getItem<{ foo: string }>('plain')).toEqual(value);
    secureStorage.setEncryptionEnabled(true);
  });

  it('disables encryption: stores plain string and returns it on get', () => {
    secureStorage.setEncryptionEnabled(false);
    secureStorage.setItem('str', 'plain-value');
    expect(localStorage.getItem('str')).toBe('plain-value');
    const got = secureStorage.getItem<string>('str');
    expect(got).toBe('plain-value');
    secureStorage.setEncryptionEnabled(true);
  });

  it('getItem returns defaultValue when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('error');
    });
    const got = secureStorage.getItem('test', 'fallback');
    expect(got).toBe('fallback');
  });
});
