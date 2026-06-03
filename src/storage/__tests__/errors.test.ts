import { StorageError, isStorageError } from '../errors';

describe('StorageError', () => {
  it('preserves code, message, and cause', () => {
    const cause = new Error('underlying');
    const err = new StorageError('NOT_FOUND', 'oops', { cause, details: { id: 'x' } });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('oops');
    expect(err.cause).toBe(cause);
    expect(err.details).toEqual({ id: 'x' });
    expect(err.name).toBe('StorageError');
  });

  it('infers QUOTA_EXCEEDED from DOMException', () => {
    const domErr = new Error('quota');
    domErr.name = 'QuotaExceededError';
    const err = StorageError.from(domErr, 'fallback');
    expect(err.code).toBe('QUOTA_EXCEEDED');
  });

  it('infers PLATFORM_UNAVAILABLE from InvalidStateError', () => {
    const domErr = new Error('state');
    domErr.name = 'InvalidStateError';
    const err = StorageError.from(domErr);
    expect(err.code).toBe('PLATFORM_UNAVAILABLE');
  });

  it('infers TRANSACTION_ABORTED from AbortError', () => {
    const domErr = new Error('abort');
    domErr.name = 'AbortError';
    const err = StorageError.from(domErr);
    expect(err.code).toBe('TRANSACTION_ABORTED');
  });

  it('infers SCHEMA_MISMATCH from VersionError', () => {
    const domErr = new Error('version');
    domErr.name = 'VersionError';
    const err = StorageError.from(domErr);
    expect(err.code).toBe('SCHEMA_MISMATCH');
  });

  it('infers INVALID_INPUT from DataCloneError', () => {
    const domErr = new Error('clone');
    domErr.name = 'DataCloneError';
    const err = StorageError.from(domErr);
    expect(err.code).toBe('INVALID_INPUT');
  });

  it('passes through StorageError unchanged', () => {
    const original = new StorageError('CORRUPTED_DATA', 'broken');
    const result = StorageError.from(original);
    expect(result).toBe(original);
  });

  it('falls back to UNKNOWN for unknown errors', () => {
    const err = StorageError.from('not an error', 'fallback');
    expect(err.code).toBe('UNKNOWN');
    expect(err.message).toBe('fallback');
  });

  it('uses provided message when Error has empty message', () => {
    const empty = new Error('');
    const result = StorageError.from(empty, 'custom fallback');
    expect(result.message).toBe('custom fallback');
  });

  it('isStorageError type guard works', () => {
    expect(isStorageError(new StorageError('UNKNOWN', 'x'))).toBe(true);
    expect(isStorageError(new Error('plain'))).toBe(false);
    expect(isStorageError('string')).toBe(false);
    expect(isStorageError(null)).toBe(false);
  });
});
