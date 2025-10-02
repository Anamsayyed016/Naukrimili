import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';
import BufferPolyfill from '@/components/BufferPolyfill';
import { Toaster } from '@/components/ui/toaster';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import CacheBustingInitializer from '@/components/CacheBustingInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Job Portal - Find Your Dream Job',
  description: 'Discover thousands of job opportunities and connect with top employers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-body`}>
        <SessionProvider>
          <GlobalErrorHandler />
          <BufferPolyfill />
          <CacheBustingInitializer />
          <MainNavigation />
          {children}
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
