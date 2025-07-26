import jwt from 'jsonwebtoken';
import { env } from './env';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Store refresh tokens (in production, use Redis)
const refreshTokenStore = new Map<string, { userId: string; expiresAt: number }>();

export function generateTokenPair(payload: TokenPayload): TokenPair {
  const accessToken = jwt.sign(payload, env.NEXTAUTH_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'jobportal',
    audience: 'jobportal-users'
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    env.NEXTAUTH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  // Store refresh token
  refreshTokenStore.set(refreshToken, {
    userId: payload.userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.NEXTAUTH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function refreshAccessToken(refreshToken: string): string | null {
  try {
    const decoded = jwt.verify(refreshToken, env.NEXTAUTH_SECRET) as any;
    const stored = refreshTokenStore.get(refreshToken);
    
    if (!stored || stored.userId !== decoded.userId || Date.now() > stored.expiresAt) {
      return null;
    }

    return jwt.sign(
      { userId: decoded.userId, type: 'access' },
      env.NEXTAUTH_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  } catch {
    return null;
  }
}

export function revokeRefreshToken(token: string): void {
  refreshTokenStore.delete(token);
}