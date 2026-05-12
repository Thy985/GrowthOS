declare module '../utils/logger' {
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';

  interface Logger {
    setLogLevel(level: LogLevel): void;
    shouldLog(level: LogLevel): boolean;
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error | null, data?: Record<string, unknown>): void;
    logApiError(endpoint: string, error: Error, data?: Record<string, unknown>): void;
    logUserAction(action: string, data?: Record<string, unknown>): void;
    logSystemEvent(event: string, data?: Record<string, unknown>): void;
  }

  const logger: Logger;
  export default logger;
}

declare module '../../utils/logger' {
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';

  interface Logger {
    setLogLevel(level: LogLevel): void;
    shouldLog(level: LogLevel): boolean;
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error | null, data?: Record<string, unknown>): void;
    logApiError(endpoint: string, error: Error, data?: Record<string, unknown>): void;
    logUserAction(action: string, data?: Record<string, unknown>): void;
    logSystemEvent(event: string, data?: Record<string, unknown>): void;
  }

  const logger: Logger;
  export default logger;
}
