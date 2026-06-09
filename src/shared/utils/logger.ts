// 日志级别
export enum LOG_LEVELS {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// 附加日志数据的类型
export type LogData = Record<string, unknown>;

// 当前日志级别
let currentLogLevel: LOG_LEVELS = LOG_LEVELS.INFO;

// 日志记录器
const logger = {
  // 设置日志级别
  setLogLevel: (level: LOG_LEVELS): void => {
    if (Object.values(LOG_LEVELS).includes(level)) {
      currentLogLevel = level;
    }
  },

  // 检查日志级别是否应该被记录
  shouldLog: (level: LOG_LEVELS): boolean => {
    const levelOrder = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR];
    return levelOrder.indexOf(level) >= levelOrder.indexOf(currentLogLevel);
  },

  // 调试日志
  debug: (message: string, data: LogData = {}): void => {
    if (logger.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  },

  // 信息日志
  info: (message: string, data: LogData = {}): void => {
    if (logger.shouldLog(LOG_LEVELS.INFO)) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    }
  },

  // 警告日志
  warn: (message: string, data: LogData = {}): void => {
    if (logger.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
    }
  },

  // 错误日志
  error: (message: string, error: unknown = null, data: LogData = {}): void => {
    if (logger.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, data);
    }
  },

  // 记录API错误
  logApiError: (endpoint: string, error: unknown, data: LogData = {}): void => {
    logger.error(`API Error: ${endpoint}`, error, {
      endpoint,
      ...data,
    });
  },

  // 记录用户操作
  logUserAction: (action: string, data: LogData = {}): void => {
    logger.info(`User Action: ${action}`, data);
  },

  // 记录系统事件
  logSystemEvent: (event: string, data: LogData = {}): void => {
    logger.info(`System Event: ${event}`, data);
  },
};

export default logger;
