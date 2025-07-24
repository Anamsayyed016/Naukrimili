import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});
import { Providers } from '@/components/providers';
import { ClientLayout } from '@/components/client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'NaukriMili - Find Your Perfect Job Match',
    template: '%s | NaukriMili',
  },
  description: 'NaukriMili connects job seekers with top employers across industries. Find your dream job today!',
  keywords: 'jobs, career, employment, job search, job portal, india jobs, recruitment, hiring',
  metadataBase: new URL('https://naukrimili.com'),
  openGraph: {
    title: 'NaukriMili - Find Your Perfect Job Match',
    description: 'NaukriMili connects job seekers with top employers across industries. Find your dream job today!',
    type: 'website',
    locale: 'en_IN',
    siteName: 'NaukriMili',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaukriMili - Find Your Perfect Job Match',
    description: 'NaukriMili connects job seekers with top employers across industries. Find your dream job today!',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${poppins.variable}`}>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
