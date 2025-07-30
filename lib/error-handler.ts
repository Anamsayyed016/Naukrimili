import { ZodError } from 'zod';
import { env } from './env';

// Enhanced error classes
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public validationErrors: string[]) {
    super(400, message, 'VALIDATION_ERROR', validationErrors);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Secure error logging
function logError(error: Error, context?: any) {
  const sanitizedContext = context ? {
    url: context.url?.replace(/[?&](token|key|password|secret)=[^&]*/gi, '$1=***'),
    method: context.method,
    userId: context.userId,
    ip: context.ip
  } : undefined;
  
  const errorInfo = {
    name: error.name,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
    errorId: crypto.randomUUID()
  };
  
  // Log full details internally
  console.error('API Error [' + errorInfo.errorId + ']:', {
    ...errorInfo,
    message: error.message,
    stack: env.NODE_ENV !== 'production' ? error.stack : undefined
  });
}

// Enhanced error handler
export function handleApiError(error: unknown, context?: any): Response {
  logError(error as Error, context);
  
  if (error instanceof ValidationError) {
    return Response.json({
      success: false,
      message: error.message,
      errors: error.validationErrors,
      code: error.code
    }, { status: error.statusCode });
  }
  
  if (error instanceof ApiError) {
    return Response.json({
      success: false,
      message: error.message,
      code: error.code,
      ...(env.NODE_ENV === 'development' && error.details && { details: error.details })
    }, { status: error.statusCode });
  }
  
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
    
    return Response.json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      code: 'VALIDATION_ERROR'
    }, { status: 400 });
  }
  
  if (error instanceof Error) {
    const errorId = crypto.randomUUID();
    const message = env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : sanitizeErrorMessage(error.message);
      
    return Response.json({
      success: false,
      message,
      code: 'INTERNAL_ERROR',
      errorId,
      ...(env.NODE_ENV === 'development' && { 
        details: sanitizeErrorMessage(error.message)
      })
    }, { status: 500 });
  }
  
  return Response.json({
    success: false,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  }, { status: 500 });
}

// Async error wrapper for API routes
export function withErrorHandler(handler: Function) {
  return async (req: any, res?: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      return handleApiError(error, { url: req.url, method: req.method });
    }
  };
}

// Database error handler
export function handleDatabaseError(error: any): ApiError {
  if (error.code === 11000) {
    return new ApiError(409, 'Resource already exists', 'DUPLICATE_ERROR');
  }
  
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map((err: any) => err.message);
    return new ValidationError('Database validation failed', validationErrors);
  }
  
  if (error.name === 'CastError') {
    return new ApiError(400, 'Invalid ID format', 'INVALID_ID');
  }
  
  return new ApiError(500, 'Database operation failed', 'DATABASE_ERROR');
}

// Legacy compatibility
export function createErrorResponse(error: unknown): Response {
  return handleApiError(error);
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
} as const;

export function createValidationError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(400, message, ErrorCodes.VALIDATION_ERROR, details);
}

export function createNotFoundError(resource: string): ApiError {
  return new ApiError(404, `${resource} not found`, ErrorCodes.NOT_FOUND);
}

export function createUnauthorizedError(message: string = 'Unauthorized'): ApiError {
  return new ApiError(401, message, ErrorCodes.UNAUTHORIZED);
}

export function createForbiddenError(message: string = 'Forbidden'): ApiError {
  return new ApiError(403, message, ErrorCodes.FORBIDDEN);
}

export function createDatabaseError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(500, message, ErrorCodes.DATABASE_ERROR, details);
}

// Sanitize error messages to prevent information leakage
function sanitizeErrorMessage(message: string): string {
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /mongodb:\/\/[^\s]+/gi,
    /postgresql:\/\/[^\s]+/gi,
    /mysql:\/\/[^\s]+/gi
  ];
  
  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}