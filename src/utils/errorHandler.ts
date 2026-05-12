import { ERROR_CODES } from '../constants';
import type { AppError } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class DuplicateEntryError extends Error {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`);
    this.name = 'DuplicateEntryError';
  }
}

export function createAppError(code: string, message: string, details?: unknown): AppError {
  return {
    code,
    message,
    details
  };
}

export function handleError(error: unknown): AppError {
  if (error instanceof ValidationError) {
    return createAppError(ERROR_CODES.VALIDATION_ERROR, error.message, { field: error.field });
  }
  
  if (error instanceof StorageError) {
    return createAppError(ERROR_CODES.STORAGE_ERROR, error.message, { originalError: error.originalError?.message });
  }
  
  if (error instanceof NotFoundError) {
    return createAppError(ERROR_CODES.NOT_FOUND, error.message);
  }
  
  if (error instanceof DuplicateEntryError) {
    return createAppError(ERROR_CODES.DUPLICATE_ENTRY, error.message);
  }
  
  if (error instanceof Error) {
    return createAppError(ERROR_CODES.UNKNOWN_ERROR, error.message);
  }
  
  return createAppError(ERROR_CODES.UNKNOWN_ERROR, 'An unknown error occurred');
}

export function logError(error: AppError, context?: string): void {
  console.error(`[${context || 'App'} Error]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  });
}
