'use client';

import { Toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';

// Dynamic imports for client components
const Header = dynamic(() => import('@/components/header'), {
  ssr: true,
  loading: () => <div className="h-16 animate-pulse bg-gray-100" />
});

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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100 transition-all">
        <Header />
      </header>
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
