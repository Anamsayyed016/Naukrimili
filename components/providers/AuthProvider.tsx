/**
 * NextAuth Provider Wrapper
 * Provides authentication context to the entire application
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session?: any;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}

export default AuthProvider;
