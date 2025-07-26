import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { secureCompare } from './encryption';

// CSRF token store (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Cleanup expired tokens
  setTimeout(() => {
    const stored = csrfTokens.get(sessionId);
    if (stored && Date.now() > stored.expires) {
      csrfTokens.delete(sessionId);
    }
  }, expires - Date.now());
  
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return secureCompare(stored.token, token);
}

export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) return headerToken;
  
  // Check form data for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Would need to parse form data - simplified for now
      return null;
    }
  }
  
  return null;
}

export function isCSRFProtectedMethod(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}