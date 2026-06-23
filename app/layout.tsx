import type { Metadata } from 'next';
import React from 'react';
import nextDynamic from 'next/dynamic';

import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import MainNavigation from '@/components/MainNavigation';
import DeferredToasters from '@/components/DeferredToasters';
import ThirdPartyScripts from '@/components/analytics/ThirdPartyScripts';
import RazorpayConsoleFilter from '@/components/analytics/RazorpayConsoleFilter';
import { ScrollOptimization } from './layout-scroll-optimization';

const Footer = nextDynamic(() => import('@/components/Footer'), { ssr: true });

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

// Get canonical base URL - use environment variable directly to avoid SSR/client mismatch
// This is safe because it's only used in metadata which is server-side only
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXTAUTH_URL || 
                 (process.env.NODE_ENV === 'production' ? 'https://naukrimili.com' : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Jobs - Recruitment - Job Search - Employment - Free Resume Builder | Naukrimili',
  description: 'Find the latest jobs in India, USA, UK, and UAE on Naukrimili. Build your free professional resume and apply for top companies worldwide.',
  keywords: 'jobs, recruitment, job search, employment, resume builder, naukrimili, hiring, vacancies, careers, openings, India jobs, USA jobs, UK jobs, UAE jobs',
  authors: [{ name: 'Naukrimili' }],
  creator: 'Naukrimili',
  publisher: 'Naukrimili',
  robots: 'index, follow',
  // Tab favicon: app/icon.tsx serves /icon; metadata.icon injects <link rel="icon"> (required — file convention alone did not emit it in production HTML).
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Naukrimili',
    title: 'Jobs - Recruitment - Job Search - Employment - Free Resume Builder | Naukrimili',
    description: 'Find the latest jobs in India, USA, UK, and UAE on Naukrimili. Build your free professional resume and apply for top companies worldwide.',
    images: [
      {
        url: 'https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_1200,h_630,c_fit/v1780573698/nmlogo_jhkny4.jpg',
        width: 1200,
        height: 630,
        alt: 'Naukrimili - Job Portal with Free Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs - Recruitment - Job Search - Employment - Free Resume Builder | Naukrimili',
    description: 'Find the latest jobs in India, USA, UK, and UAE on Naukrimili. Build your free professional resume and apply for top companies worldwide.',
    images: ['https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_1200,h_630,c_fit/v1780573698/nmlogo_jhkny4.jpg'],
    creator: '@naukrimili',
    site: '@naukrimili',
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en-IN': `${BASE_URL}/en-in`,
      'en-US': `${BASE_URL}/en-us`,
      'en-GB': `${BASE_URL}/en-gb`,
      'ar-AE': `${BASE_URL}/ar-ae`,
    },
  },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.YANDEX_VERIFICATION && {
      yandex: process.env.YANDEX_VERIFICATION,
    }),
    ...(process.env.YAHOO_VERIFICATION && {
      yahoo: process.env.YAHOO_VERIFICATION,
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <RazorpayConsoleFilter />

        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="IN, US, GB, AE" />
        <meta name="geo.placename" content="India, United States, United Kingdom, United Arab Emirates" />
        <meta name="geo.position" content="20.5937;78.9629, 39.8283;-98.5795, 55.3781;-3.4360, 23.4241;53.8478" />
        <meta name="ICBM" content="20.5937, 78.9629, 39.8283, -98.5795, 55.3781, -3.4360, 23.4241, 53.8478" />
        <meta name="language" content="en-IN, en-US, en-GB, ar-AE" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Naukrimili" />
        <meta name="application-name" content="Naukrimili Job Portal" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Naukrimili",
              "alternateName": "Naukrimili Job Portal",
              "url": BASE_URL,
              "logo": "https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_480/v1780573698/nmlogo_jhkny4.jpg",
              "description": "Leading job portal connecting job seekers with top employers across India, USA, UK, and UAE. Free resume builder included.",
              "foundingDate": "2024",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": ["IN", "US", "GB", "AE"],
                "addressLocality": "Global"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi", "Arabic"]
              },
              "sameAs": [
                "https://www.linkedin.com/company/naukrimili",
                "https://twitter.com/naukrimili",
                "https://www.facebook.com/naukrimili"
              ],
              "areaServed": [
                {
                  "@type": "Country",
                  "name": "India"
                },
                {
                  "@type": "Country", 
                  "name": "United States"
                },
                {
                  "@type": "Country",
                  "name": "United Kingdom"
                },
                {
                  "@type": "Country",
                  "name": "United Arab Emirates"
                }
              ]
            })
          }}
        />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Naukrimili",
              "url": BASE_URL,
              "description": "Find the latest jobs in India, USA, UK, and UAE. Build your free professional resume and apply for top companies worldwide.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${BASE_URL}/jobs?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Naukrimili",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_480/v1780573698/nmlogo_jhkny4.jpg"
                }
              }
            })
          }}
        />

        {/* Structured Data - JobPosting (Sample) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Software Engineer - Remote",
              "description": "Join our dynamic team as a Software Engineer. Work on cutting-edge projects with modern technologies.",
              "identifier": {
                "@type": "PropertyValue",
                "name": "naukrimili",
                "value": "SE-2024-001"
              },
              "datePosted": "2024-01-15",
              "validThrough": "2024-03-15",
              "employmentType": "FULL_TIME",
              "hiringOrganization": {
                "@type": "Organization",
                "name": "Tech Solutions Inc",
                "sameAs": "https://www.techsolutions.com"
              },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Bangalore",
                  "addressRegion": "Karnataka",
                  "addressCountry": "IN"
                }
              },
              "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": "INR",
                "value": {
                  "@type": "QuantitativeValue",
                  "minValue": 800000,
                  "maxValue": 1200000,
                  "unitText": "YEAR"
                }
              },
              "qualifications": "Bachelor's degree in Computer Science or related field, 3+ years experience",
              "responsibilities": "Develop and maintain web applications, collaborate with cross-functional teams",
              "skills": "JavaScript, React, Node.js, Python",
              "workHours": "40 hours per week",
              "benefits": "Health insurance, flexible working hours, remote work options"
            })
          }}
        />

        {/* Structured Data - Service (Resume Builder) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Free AI Resume Builder",
              "alternateName": "Professional Resume Builder",
              "description": "Create professional resumes for free with our AI-powered resume builder. Optimized for ATS systems and designed for job success.",
              "provider": {
                "@type": "Organization",
                "name": "Naukrimili",
                "url": BASE_URL
              },
              "areaServed": [
                {
                  "@type": "Country",
                  "name": "India"
                },
                {
                  "@type": "Country",
                  "name": "United States"
                },
                {
                  "@type": "Country",
                  "name": "United Kingdom"
                },
                {
                  "@type": "Country",
                  "name": "United Arab Emirates"
                }
              ],
              "serviceType": "Resume Writing Service",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "description": "Free professional resume builder with AI optimization"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Resume Builder Features",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "ATS-Optimized Templates"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "AI Content Suggestions"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Multiple Format Downloads"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Industry-Specific Templates"
                    }
                  }
                ]
              },
              "audience": {
                "@type": "Audience",
                "audienceType": "Job Seekers"
              }
            })
          }}
        />

        {/* Structured Data - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": BASE_URL
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Jobs",
                  "item": `${BASE_URL}/jobs`
                },
              ]
            })
          }}
        />

      </head>
      <body className={`${inter.className} font-body`}>
        <ThirdPartyScripts />
        {/* Google Tag Manager (noscript) - Must be first in <body> */}
        {process.env.NEXT_PUBLIC_GTM_CONTAINER_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_CONTAINER_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <SessionProvider>
          <ScrollOptimization />
          <MainNavigation />
          {children}
          <Footer />
          <DeferredToasters />
        </SessionProvider>
      </body>
    </html>
  );
}
