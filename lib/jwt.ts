import jwt from 'jsonwebtoken';
import * as Env from './env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// In-memory refresh token store (replace with DB/Redis in prod)
const refreshTokenStore = new Map<string, { userId: string; expiresAt: number }>();

export function generateTokenPair(payload: TokenPayload): TokenPair {
  const secret = (Env as any).env?.NEXTAUTH_SECRET as string | undefined;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured');
  const accessToken = jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'jobportal',
    audience: 'jobportal-users',
  });
  const refreshToken = jwt.sign({ userId: payload.userId, type: 'refresh' }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  refreshTokenStore.set(refreshToken, {
    userId: payload.userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
  const secret = (Env as any).env?.NEXTAUTH_SECRET as string | undefined;
  if (!secret) return null;
  const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

export function refreshAccessToken(refreshToken: string): string | null {
  try {
  const secret = (Env as any).env?.NEXTAUTH_SECRET as string | undefined;
  if (!secret) return null;
  const decoded = jwt.verify(refreshToken, secret) as any;
    const stored = refreshTokenStore.get(refreshToken);
    if (!stored || stored.userId !== decoded.userId || Date.now() > stored.expiresAt) return null;
  return jwt.sign({ userId: decoded.userId, type: 'access' }, secret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch {
    return null;
  }
}

export function revokeRefreshToken(token: string): void {
  refreshTokenStore.delete(token);
}
