import { 
  successResponse, 
  errorResponse, 
  ApiResponse, 
  AppError, 
  ErrorFactory,
  isSuccess
} from './ApiResponse';
import { withRetry, deduplicator, withTimeout, RequestConfig } from './RequestUtils';
import logger from '../../utils/logger';

export abstract class BaseService {
  protected serviceName: string;
  protected enableRetry: boolean = true;
  protected enableDeduplication: boolean = true;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  protected logInfo(message: string, data?: Record<string, unknown>): void {
    logger.info(`[${this.serviceName}] ${message}`, data);
  }

  protected logError(message: string, error?: Error, data?: Record<string, unknown>): void {
    logger.error(`[${this.serviceName}] ${message}`, error, data);
  }

  protected logWarn(message: string, data?: Record<string, unknown>): void {
    logger.warn(`[${this.serviceName}] ${message}`, data);
  }

  protected async execute<T>(
    operation: string,
    fn: () => Promise<T>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      this.logInfo(`Executing: ${operation}`);
      
      let fnToExecute = fn;

      if (config?.retry && this.enableRetry) {
        const retryConfig = {
          ...config.retry,
          retryableErrors: config.retry.retryableErrors || [
            'NETWORK_ERROR',
            'STORAGE_ERROR',
            'INTERNAL_ERROR'
          ]
        };
        fnToExecute = async () => withRetry(fn, retryConfig as any);
      }

      if (this.enableDeduplication) {
        const key = `${this.serviceName}:${operation}`;
        fnToExecute = () => deduplicator.deduplicate(key, fnToExecute);
      }

      if (config?.timeout) {
        const timeout = config.timeout;
        fnToExecute = () => withTimeout(() => fnToExecute(), timeout);
      }

      const result = await fnToExecute();
      return successResponse(result);
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : ErrorFactory.unknown(error);
      
      this.logError(`Operation failed: ${operation}`, appError);
      return errorResponse(appError) as unknown as ApiResponse<T>;
    }
  }

  protected async executeOrThrow<T>(
    operation: string,
    fn: () => Promise<T>,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.execute(operation, fn, config);
    
    if (isSuccess(response)) {
      return response.data;
    }
    
    throw response.error;
  }

  protected validateRequired(value: unknown, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw ErrorFactory.validation(`${fieldName} is required`);
    }
  }

  protected validateString(value: unknown, fieldName: string, minLength?: number, maxLength?: number): string {
    if (typeof value !== 'string') {
      throw ErrorFactory.validation(`${fieldName} must be a string`);
    }
    
    if (minLength && value.length < minLength) {
      throw ErrorFactory.validation(`${fieldName} must be at least ${minLength} characters`);
    }
    
    if (maxLength && value.length > maxLength) {
      throw ErrorFactory.validation(`${fieldName} must be at most ${maxLength} characters`);
    }
    
    return value;
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ErrorFactory.validation('Invalid email format');
    }
  }

  protected validatePassword(password: string): void {
    if (password.length < 8) {
      throw ErrorFactory.validation('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw ErrorFactory.validation('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw ErrorFactory.validation('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw ErrorFactory.validation('Password must contain at least one number');
    }
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export function createPaginationParams(params: PaginationParams): Required<PaginationParams> {
  return {
    page: Math.max(1, params.page || 1),
    limit: Math.min(100, Math.max(1, params.limit || 20)),
    cursor: params.cursor || ''
  };
}

export function createPaginatedResult<T extends Record<string, unknown>>(
  items: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResult<T> {
  const { page, limit } = params;
  const startIndex = (page - 1) * limit;
  
  return {
    items,
    total,
    page,
    limit,
    hasMore: startIndex + items.length < total,
    nextCursor: items.length === limit && items[items.length - 1] ? 
      items[items.length - 1].id as string : undefined
  };
}
