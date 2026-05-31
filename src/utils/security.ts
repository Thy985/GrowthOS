export interface CSRFTokenData {
  token: string,
  headerName: string,
  parameterName: string,
  expiresAt: number,
}

export interface SecurityHeaders {
  'Content-Security-Policy': string,
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': string,
  'Referrer-Policy': string,
  'Permissions-Policy': string,
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.openai.com https://*.azure.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

let csrfTokenData: CSRFTokenData | null = null;

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function initCSRFToken(): CSRFTokenData {
  const token = generateCSRFToken();
  csrfTokenData = {
    token,
    headerName: 'X-CSRF-Token',
    parameterName: 'csrf_token',
    expiresAt: Date.now() + 3600000,
  };
  return csrfTokenData;
}

export function getCSRFToken(): CSRFTokenData | null {
  if (csrfTokenData && csrfTokenData.expiresAt > Date.now()) {
    return csrfTokenData;
  }
  return null;
}

export function validateCSRFToken(token: string): boolean {
  const stored = getCSRFToken();
  if (!stored) {
    return false;
  }
  return stored.token === token && stored.expiresAt > Date.now();
}

export function refreshCSRFToken(): CSRFTokenData {
  return initCSRFToken();
}

export function applySecurityHeadersToResponse(): Record<string, string> {
  const headers: Record<string, string> = {};
  Object.entries(DEFAULT_SECURITY_HEADERS).forEach(([key, value]) => {
    headers[key] = value;
  });
  return headers;
}

export interface SecureRequestOptions {
  headers?: Record<string, string>,
}

export function createSecureRequestOptions(options?: SecureRequestOptions): SecureRequestOptions {
  return {
    ...options,
    headers: {
      ...options?.headers,
      'X-Request-ID': crypto.randomUUID(),
      'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
    },
  };
}

export function addCSRFToHeaders(headers: Record<string, string>): Record<string, string> {
  const csrf = getCSRFToken();
  if (csrf) {
    return {
      ...headers,
      [csrf.headerName]: csrf.token,
    };
  }
  return headers;
}

export interface RateLimitConfig {
  maxRequests: number,
  windowMs: number,
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.config = config;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.config.windowMs);
    
    if (validTimestamps.length >= this.config.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.config.windowMs);
    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  clear(): void {
    this.requests.clear();
  }
}

export const apiRateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 });
export const authRateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
