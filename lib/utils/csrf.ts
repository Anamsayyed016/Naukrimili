import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection Utility
 * Provides consistent CSRF validation across API routes
 */

export interface CSRFValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate CSRF protection for incoming requests
 */
export function validateCSRF(request: NextRequest): CSRFValidationResult {
  // Skip CSRF validation if disabled
  if (process.env.CSRF_ENABLED === 'false') {
    return { isValid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const csrfToken = request.headers.get('x-csrf-token');
  
  // Validate origin
  if (origin) {
    const expectedOrigin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    if (!origin.startsWith(expectedOrigin)) {
      return {
        isValid: false,
        error: 'CSRF protection: Invalid origin'
      };
    }
  }
  
  // Validate referer
  if (referer) {
    const expectedOrigin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    if (!referer.startsWith(expectedOrigin)) {
      return {
        isValid: false,
        error: 'CSRF protection: Invalid referer'
      };
    }
  }
  
  // Validate CSRF token if provided
  if (csrfToken) {
    const storedToken = request.cookies.get('next-auth.csrf-token')?.value;
    if (csrfToken !== storedToken) {
      return {
        isValid: false,
        error: 'CSRF protection: Invalid token'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request body or headers
 */
export function validateCSRFToken(request: NextRequest, token?: string): CSRFValidationResult {
  if (!token) {
    return {
      isValid: false,
      error: 'CSRF protection: Missing token'
    };
  }

  const storedToken = request.cookies.get('next-auth.csrf-token')?.value;
  if (token !== storedToken) {
    return {
      isValid: false,
      error: 'CSRF protection: Token mismatch'
    };
  }

  return { isValid: true };
}

/**
 * Create CSRF error response
 */
export function createCSRFErrorResponse(error: string) {
  return {
    success: false,
    error,
    code: 'CSRF_VALIDATION_FAILED'
  };
}
