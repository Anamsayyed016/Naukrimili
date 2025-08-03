import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { ErrorBoundary } from '@/lib/error-boundary'
import Navigation from '@/components/navigation/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NaukriMili - AI-Powered Job Portal',
  description: 'Find your dream job with AI-powered resume parsing and intelligent job matching',
  keywords: 'jobs, career, employment, AI, resume, job portal, India',
  authors: [{ name: 'NaukriMili Team' }],
  creator: 'NaukriMili',
  publisher: 'NaukriMili',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://naukrimili.com'),
  openGraph: {
    title: 'NaukriMili - AI-Powered Job Portal',
    description: 'Find your dream job with AI-powered resume parsing and intelligent job matching',
    url: 'https://naukrimili.com',
    siteName: 'NaukriMili',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NaukriMili - AI-Powered Job Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaukriMili - AI-Powered Job Portal',
    description: 'Find your dream job with AI-powered resume parsing and intelligent job matching',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <Navigation />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
