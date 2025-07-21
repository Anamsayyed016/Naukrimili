import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/header';
import Footer from '@/components/LivingFooter';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import SessionProvider from '@/components/SessionProvider';
import ReactQueryProvider from '@/components/ReactQueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'JobPortalX - Find Your Dream Job',
    template: '%s | JobPortalX',
  },
  description: 'Connect employers with top talent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <SessionProvider>
              <AuthProvider>
                <div className="min-h-screen flex flex-col">
                {/* Sticky Navbar */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 transition-all">
                  <Navbar />
                </header>
                {/* Main Content */}
                <main className="flex-grow w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
                  {children}
                  {/* Placeholder for global modals */}
                </main>
                {/* Sticky Footer */}
                <footer className="mt-auto w-full bg-white/80 dark:bg-gray-950/80 border-t border-gray-100 dark:border-gray-800 transition-all">
                  <Footer />
                </footer>
                          </div>
              <Toaster />
            </AuthProvider>
              </SessionProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
