import { getServerSession } from 'next-auth';
import { authOptions } from './nextauth-config';

/**
 * Return the NextAuth session or null on failure.
 */
export async function getSession() {
  try {
    // Casting to any avoids tight coupling to the authOptions type here.
    return await getServerSession(authOptions as any);
  } catch {
    return null;
  }
}

/**
 * Convenience helper to get the current user from the session.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (session && typeof session === 'object' && 'user' in session) {
    return (session as any).user ?? null;
  }
  return null;
}