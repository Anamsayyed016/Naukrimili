import { env } from './env';

export function generateCSP(): string {
  const isDev = env.NODE_ENV === 'development';

  const csp: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'", 
      "'unsafe-inline'", 
      'https://pagead2.googlesyndication.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://api.goaffpro.com',
      ...(isDev ? ["'unsafe-eval'"] : [])
    ],
    "style-src": ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    "img-src": ["'self'", 'data:', 'https:', 'blob:', 'https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com'],
    "font-src": ["'self'", 'https://fonts.gstatic.com'],
    "connect-src": [
      "'self'", 
      'https://api.openai.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://pagead2.googlesyndication.com',
      'https://googleads.g.doubleclick.net',
      'https://api.goaffpro.com',
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : [])
    ],
    "frame-src": [
      "'self'",
      'https://googleads.g.doubleclick.net',
      'https://tpc.googlesyndication.com',
      'https://pagead2.googlesyndication.com'
    ],
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
