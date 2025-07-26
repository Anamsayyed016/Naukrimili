import { NextResponse } from 'next/server';

export interface StandardError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
          details: error.details
        }
      },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'INTERNAL_ERROR',
          status: 500
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        status: 500
      }
    },
    { status: 500 }
  );
}

// Common error types
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
  return new ApiError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
}

export function createNotFoundError(resource: string): ApiError {
  return new ApiError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND);
}

export function createUnauthorizedError(message: string = 'Unauthorized'): ApiError {
  return new ApiError(message, 401, ErrorCodes.UNAUTHORIZED);
}

export function createForbiddenError(message: string = 'Forbidden'): ApiError {
  return new ApiError(message, 403, ErrorCodes.FORBIDDEN);
}

export function createDatabaseError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(message, 500, ErrorCodes.DATABASE_ERROR, details);
}