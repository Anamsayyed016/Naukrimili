import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { env } from './env';

const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

interface SessionData {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  createdAt: number;
  lastActivity: number;
}

// Active sessions store (use Redis in production)
const activeSessions = new Map<string, SessionData>();

export async function createSecureSession(userData: Omit<SessionData, 'sessionId' | 'createdAt' | 'lastActivity'>): Promise<string> {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  const sessionData: SessionData = {
    ...userData,
    sessionId,
    createdAt: now,
    lastActivity: now
  };
  
  activeSessions.set(sessionId, sessionData);
  
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
    
  return token;
}

export async function validateSession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const sessionId = payload.sessionId as string;
    
    const session = activeSessions.get(sessionId);
    if (!session) return null;
    
    // Check session timeout (24 hours)
    if (Date.now() - session.lastActivity > 24 * 60 * 60 * 1000) {
      activeSessions.delete(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    
    return session;
  } catch {
    return null;
  }
}

export function revokeSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

export function revokeAllUserSessions(userId: string): void {
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
    }
  }
}

export function setSecureCookie(response: NextResponse, name: string, value: string): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });
}

export function clearSecureCookie(response: NextResponse, name: string): void {
  response.cookies.delete(name);
}