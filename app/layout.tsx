import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';
import BufferPolyfill from '@/components/BufferPolyfill';
import { Toaster } from '@/components/ui/toaster';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import ForceNewHash from '@/components/ForceNewHash';
import CSSLoader from '@/components/CSSLoader';
// FORCE HASH CHANGE - Build timestamp: 2025-10-02 14:30:00 - MAJOR CHANGE

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
          <ForceNewHash />
          <CSSLoader />
          <MainNavigation />
          {children}
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
