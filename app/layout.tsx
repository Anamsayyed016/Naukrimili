import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NaukriMili - AI-Powered Job Portal',
  description: 'Find your dream job with AI-powered matching. Discover thousands of opportunities across India.',
  keywords: 'jobs, career, employment, AI, India, naukri, recruitment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <MainNavigation />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}