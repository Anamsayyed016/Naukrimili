import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';
import BufferPolyfill from '@/components/BufferPolyfill';
import { Toaster } from '@/components/ui/toaster';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';
import MobileErrorBoundary from '@/components/MobileErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NaukriMili - Find Your Dream Job',
  description: 'Discover thousands of job opportunities and connect with top employers',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'NaukriMili - Find Your Dream Job',
    description: 'Discover thousands of job opportunities and connect with top employers',
    images: ['/logo.svg'],
  },
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
          <MobileErrorBoundary>
            <BufferPolyfill />
            <MainNavigation />
            {children}
            <Footer />
            <Toaster />
          </MobileErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}
