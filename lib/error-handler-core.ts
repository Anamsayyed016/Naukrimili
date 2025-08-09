import { ZodError } from 'zod';
import { env } from './env';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
  constructor(statusCode: number, message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  validationErrors: string[];
  constructor(message: string, validationErrors: string[]) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

const SENSITIVE_PATTERNS: RegExp[] = [
  /password/gi,
  /token/gi,
  /secret/gi,
  /api[_-]?key/gi,
  /mongodb:\/\/[^\s]+/gi,
  /postgresql:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
];

function sanitize(message: string): string {
  let m = message || '';
  for (const pattern of SENSITIVE_PATTERNS) m = m.replace(pattern, '[REDACTED]');
  return m;
}

function logError(error: unknown, context?: Record<string, unknown>) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const errorId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const display = env.NODE_ENV === 'production' ? 'Internal server error' : sanitize(err.message);
    if (env.NODE_ENV !== 'production') {
      console.error(`API Error [${errorId}]:`, display);
      if (err.stack) console.error('Stack:', err.stack);
      if (context) console.error('Context:', context);
    } else {
      console.error(`API Error [${errorId}]`);
    }
  } catch (loggingErr) {
    console.error('Failed to log error', loggingErr);
  }
}

function json(body: unknown, init?: ResponseInit): Response {
  return Response.json(body as any, init);
}

export function handleApiError(error: unknown, context?: Record<string, unknown>): Response {
  logError(error, context);
  if (error instanceof ValidationError) {
    return json(
      { success: false, message: error.message, code: error.code, errors: error.validationErrors },
      { status: error.statusCode },
    );
  }
  if (error instanceof ApiError) {
    return json(
      {
        success: false,
        message: error.message,
        code: error.code,
        ...(env.NODE_ENV === 'development' && error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode },
    );
  }
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });
    return json(
      { success: false, message: 'Validation failed', code: 'VALIDATION_ERROR', errors: validationErrors },
      { status: 400 },
    );
  }
  if (error instanceof Error) {
    const errorId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const message = env.NODE_ENV === 'production' ? 'An unexpected error occurred' : sanitize(error.message);
    return json(
      {
        success: false,
        message,
        code: 'INTERNAL_ERROR',
        errorId,
        ...(env.NODE_ENV === 'development' ? { details: sanitize(error.message) } : {}),
      },
      { status: 500 },
    );
  }
  return json({ success: false, message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }, { status: 500 });
}

export function withErrorHandler<T extends (...args: any[]) => Promise<Response> | Response>(
  handler: T,
): (...funcArgs: Parameters<T>) => Promise<Response> {
  return async (...funcArgs: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...funcArgs);
    } catch (err) {
      const maybeReq = funcArgs?.[0] as any;
      const context =
        maybeReq && typeof maybeReq === 'object'
          ? { url: maybeReq?.url, method: maybeReq?.method }
          : undefined;
      return handleApiError(err, context);
    }
  };
}

export function handleDatabaseError(error: unknown): ApiError {
  const e: any = error || {};
  if (e?.code === 11000) return new ApiError(409, 'Resource already exists', 'DUPLICATE_ERROR');
  if (e?.name === 'ValidationError') {
    const validationErrors: string[] = Object.values(e.errors || {}).map((err: any) => String(err?.message || 'Invalid'));
    return new ValidationError('Database validation failed', validationErrors);
  }
  if (e?.name === 'CastError') return new ApiError(400, 'Invalid ID format', 'INVALID_ID');
  return new ApiError(500, 'Database operation failed', 'DATABASE_ERROR');
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export function createValidationError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(400, message, ErrorCodes.VALIDATION_ERROR, details);
}
export function createNotFoundError(resource: string): ApiError {
  return new ApiError(404, `${resource} not found`, ErrorCodes.NOT_FOUND);
}
export function createUnauthorizedError(message = 'Unauthorized'): ApiError {
  return new ApiError(401, message, ErrorCodes.UNAUTHORIZED);
}
export function createForbiddenError(message = 'Forbidden'): ApiError {
  return new ApiError(403, message, ErrorCodes.FORBIDDEN);
}
export function createDatabaseError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(500, message, ErrorCodes.DATABASE_ERROR, details);
}

export function createErrorResponse(error: unknown): Response {
  return handleApiError(error);
}
