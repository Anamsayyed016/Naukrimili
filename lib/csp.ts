import { env } from './env';

export function generateCSP(): string {
  const isDev = env.NODE_ENV === 'development';

  const csp: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    "img-src": ["'self'", 'data:', 'https:', 'blob:'],
    "font-src": ["'self'", 'https://fonts.gstatic.com'],
    "connect-src": ["'self'", 'https://api.openai.com', ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : [])],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(csp)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}