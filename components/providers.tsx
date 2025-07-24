'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SessionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
