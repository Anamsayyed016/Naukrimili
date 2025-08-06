import React from "react";
'use client';
import { Toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';
import MainNavigation from '@/components/MainNavigation';

// Dynamic import for footer only
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: true,
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="mt-auto">
        <Footer />
      </footer>
      <Toaster />
    </div>
  );
}
