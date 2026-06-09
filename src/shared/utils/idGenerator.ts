/**
 * Generate a unique ID using crypto.randomUUID when available,
 * falling back to a timestamp + random string for older environments.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp (ms) + 4 hex random chars
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
