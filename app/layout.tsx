import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';
import BufferPolyfill from '@/components/BufferPolyfill';

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
          <BufferPolyfill />
          <MainNavigation />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
