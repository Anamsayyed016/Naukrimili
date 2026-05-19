/**
 * Opt-in auth diagnostics (server-only).
 * Set AUTH_DEBUG=true in PM2/.env during investigations; remove when done.
 */

const AUTH_DEBUG =
  process.env.AUTH_DEBUG === 'true' ||
  process.env.AUTH_DEBUG === '1';

function redactEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function authDebug(
  scope: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  if (!AUTH_DEBUG) return;

  const safeMeta = meta
    ? Object.fromEntries(
        Object.entries(meta).map(([key, value]) => {
          if (key === 'email' && typeof value === 'string') {
            return [key, redactEmail(value)];
          }
          return [key, value];
        })
      )
    : undefined;

  console.log(`[AUTH_DEBUG][${scope}] ${message}`, safeMeta ?? '');
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  const connectionCodes = new Set([
    'P1000',
    'P1001',
    'P1002',
    'P1003',
    'P1008',
    'P1010',
    'P1011',
    'P1017',
  ]);
  if (e.code && connectionCodes.has(e.code)) return true;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes("can't reach database") ||
    msg.includes('connection') ||
    msg.includes('econnrefused') ||
    msg.includes('invalid connection string')
  );
}
