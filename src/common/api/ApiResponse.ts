export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'ENCRYPTION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  public code: ErrorCode;
  public details?: Record<string, unknown>;
  public statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }

  static fromApiError(apiError: ApiError, statusCode?: number): AppError {
    return new AppError(
      apiError.code,
      apiError.message,
      apiError.details,
      statusCode
    );
  }
}

export const ErrorFactory = {
  validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('VALIDATION_ERROR', message, details, 400);
  },

  notFound(resource: string, id?: string): AppError {
    return new AppError(
      'NOT_FOUND',
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      { resource, id },
      404
    );
  },

  unauthorized(message = 'Unauthorized access'): AppError {
    return new AppError('UNAUTHORIZED', message, undefined, 401);
  },

  forbidden(message = 'Access forbidden'): AppError {
    return new AppError('FORBIDDEN', message, undefined, 403);
  },

  conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('CONFLICT', message, details, 409);
  },

  internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, undefined, 500);
  },

  network(message = 'Network error'): AppError {
    return new AppError('NETWORK_ERROR', message, undefined, 0);
  },

  storage(message = 'Storage error'): AppError {
    return new AppError('STORAGE_ERROR', message, undefined, 500);
  },

  encryption(message = 'Encryption error'): AppError {
    return new AppError('ENCRYPTION_ERROR', message, undefined, 500);
  },

  unknown(error: unknown): AppError {
    if (error instanceof AppError) return error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new AppError('UNKNOWN_ERROR', message);
  }
};

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

export function errorResponse(error: AppError | Error): ApiResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.toApiError()
    };
  }
  return {
    success: false,
    error: ErrorFactory.unknown(error).toApiError()
  };
}

export function isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

export function isError<T>(response: ApiResponse<T>): response is { success: false; error: ApiError } {
  return !response.success && 'error' in response && response.error !== undefined;
}
