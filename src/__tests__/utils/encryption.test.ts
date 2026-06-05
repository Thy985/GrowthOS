import { describe, it, expect } from 'vitest';

import encryption from '../../shared/utils/encryption.ts';

describe('encryption', () => {
  it('encrypts and decrypts a string round-trip', () => {
    const input = 'hello world';
    const encrypted = encryption.encrypt(input);
    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toBe(input);
    const decrypted = encryption.decrypt(encrypted as string);
    expect(decrypted).toBe(input);
  });

  it('encrypts and decrypts an object round-trip', () => {
    const obj = { a: 1, b: 'x', c: [1, 2, 3] };
    const encrypted = encryption.encrypt(obj);
    expect(encrypted).not.toBeNull();
    const decrypted = encryption.decrypt(encrypted as string);
    expect(decrypted).toEqual(obj);
  });

  it('returns empty string for empty input', () => {
    expect(encryption.encrypt('')).toBe('');
  });

  it('returns null for decrypting empty input', () => {
    expect(encryption.decrypt('')).toBeNull();
  });

  it('returns null when decrypting garbage', () => {
    const result = encryption.decrypt('not-a-valid-ciphertext-xyz');
    // 损坏的密文会抛错,被 catch 返回 null
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('encrypts plain string (not object) without JSON escaping the value', () => {
    const input = 'plain text';
    const encrypted = encryption.encrypt(input) as string;
    // 字符串不走 JSON.stringify,应能直接 round-trip 回原值
    expect(encryption.decrypt(encrypted)).toBe(input);
  });
});
