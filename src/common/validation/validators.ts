import { type z, ZodError } from 'zod';
import { ErrorFactory } from '../api/ApiResponse';

export interface ValidationResult<T> {
  success: boolean,
  data?: T,
  errors?: ValidationError[],
}

export interface ValidationError {
  field: string,
  message: string,
  code: string,
}

export function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
    code: issue.code
  }));
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: formatZodError(error)
      };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'UNKNOWN_ERROR'
      }]
    };
  }
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, _fieldName?: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodError(error);
      const firstError = errors[0];
      throw ErrorFactory.validation(
        firstError ? `${firstError.field}: ${firstError.message}` : 'Validation failed',
        { errors }
      );
    }
    throw ErrorFactory.unknown(error);
  }
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

export function parseFormData<T extends Record<string, unknown>>(
  formData: FormData,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const rawData: Record<string, unknown> = {};
  
  formData.forEach((value, key) => {
    if (value instanceof File) {
      rawData[key] = value;
    } else if (value === '') {
      rawData[key] = undefined;
    } else {
      rawData[key] = value;
    }
  });

  return validate(schema, rawData);
}

export function validateField(
  value: unknown,
  fieldName: string,
  validations: Array<{
    test: (val: unknown) => boolean,
    message: string,
  }>
): ValidationError | null {
  for (const validation of validations) {
    if (!validation.test(value)) {
      return {
        field: fieldName,
        message: validation.message,
        code: 'VALIDATION_ERROR'
      };
    }
  }
  return null;
}

export const validators = {
  isNonEmpty: (value: unknown): boolean => {
    return value !== null && value !== undefined && value !== '';
  },

  isEmail: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  isUrl: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  minLength: (min: number) => (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return value.length >= min;
  },

  maxLength: (max: number) => (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return value.length <= max;
  },

  isNumber: (value: unknown): boolean => {
    return typeof value === 'number' && !isNaN(value);
  },

  isInteger: (value: unknown): boolean => {
    return Number.isInteger(value as number);
  },

  minValue: (min: number) => (value: unknown): boolean => {
    if (typeof value !== 'number') return false;
    return value >= min;
  },

  maxValue: (max: number) => (value: unknown): boolean => {
    if (typeof value !== 'number') return false;
    return value <= max;
  },

  isDate: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  isBoolean: (value: unknown): boolean => {
    return typeof value === 'boolean';
  },

  isArray: (value: unknown): boolean => {
    return Array.isArray(value);
  },

  isObject: (value: unknown): boolean => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  matchesPattern: (pattern: RegExp) => (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return pattern.test(value);
  },

  isOneOf: <T>(allowedValues: T[]) => (value: unknown): boolean => {
    return allowedValues.includes(value as T);
  }
};
