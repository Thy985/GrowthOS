declare const logger: {
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | null, data?: Record<string, unknown>): void;
  logApiError(endpoint: string, error: Error, data?: Record<string, unknown>): void;
  logUserAction(action: string, data?: Record<string, unknown>): void;
  logSystemEvent(event: string, data?: Record<string, unknown>): void;
};

export default logger;
