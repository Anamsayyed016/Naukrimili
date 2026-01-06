import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { ScrollOptimization } from './layout-scroll-optimization';
// Note: getBaseUrl is imported dynamically to prevent SSR hydration issues
const inter = Inter({ subsets: ['latin'] });

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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon', sizes: '48x48', type: 'image/png' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/icon', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.svg' }],
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
        url: 'https://res.cloudinary.com/dko2hk0yo/image/upload/e_bgremoval:white/e_trim/b_rgb:ffffff/f_png/q_auto/v1762626132/naulogokriil1_aqjojr.png',
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
    images: ['https://res.cloudinary.com/dko2hk0yo/image/upload/e_bgremoval:white/e_trim/b_rgb:ffffff/f_png/q_auto/v1762626132/naulogokriil1_aqjojr.png'],
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
        {/* Google Tag Manager - Must be first in <head> */}
        {process.env.NEXT_PUBLIC_GTM_CONTAINER_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_CONTAINER_ID}');
              `,
            }}
          />
        )}

        {/* Enhanced Google Analytics 4 with Event Tracking */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q3KBBWYNR9"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Q3KBBWYNR9', {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                  'custom_parameter_1': 'resume_builder_opened',
                  'custom_parameter_2': 'resume_downloaded',
                  'custom_parameter_3': 'job_applied'
                }
              });
              console.log("✅ Google Analytics Initialized with Enhanced Tracking");
            `,
          }}
        />

        {/* High-quality favicon links - optimized for maximum visibility at small sizes */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon" />
        <link rel="apple-touch-icon" sizes="256x256" href="/apple-icon" />
        
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
              "logo": "https://res.cloudinary.com/dko2hk0yo/image/upload/e_bgremoval:white/e_trim/b_rgb:ffffff/f_png/q_auto/v1762626132/naulogokriil1_aqjojr.png",
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
                  "url": "https://res.cloudinary.com/dko2hk0yo/image/upload/e_bgremoval:white/e_trim/b_rgb:ffffff/f_png/q_auto/v1762626132/naulogokriil1_aqjojr.png"
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

        {/* Enhanced GA4 Event Tracking Functions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced tracking functions
              function trackResumeDownloaded(format) {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'resume_downloaded', {
                    event_category: 'Resume Builder',
                    event_label: 'Resume downloaded in ' + format + ' format',
                    value: 1
                  });
                  console.log('✅ Tracked: Resume Downloaded - ' + format);
                }
              }

              function trackJobApplied(jobId, jobTitle, company) {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'job_applied', {
                    event_category: 'Job Application',
                    event_label: 'Applied to ' + company + ' - ' + jobTitle,
                    job_id: jobId,
                    company: company,
                    job_title: jobTitle,
                    value: 1
                  });
                  console.log('✅ Tracked: Job Applied - ' + company);
                }
              }

              // Make functions globally available
              window.trackResumeDownloaded = trackResumeDownloaded;
              window.trackJobApplied = trackJobApplied;
            `,
          }}
        />

        {/* ✅ Google Analytics + SEO Installed Successfully */}

        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8909131989940319"
            crossOrigin="anonymous"></script>
        
        {/* CRITICAL: Suppress Razorpay console errors BEFORE Razorpay scripts load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Only set up once
                if (window.__razorpayErrorSuppressionSetup) return;
                window.__razorpayErrorSuppressionSetup = true;
                
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                const originalInfo = console.info;
                const originalDir = console.dir;
                const originalTable = console.table;
                
                const shouldSuppress = function(message) {
                  if (!message) return false;
                  if (typeof message !== 'string') {
                    try {
                      message = JSON.stringify(message);
                    } catch(e) {
                      message = String(message);
                    }
                  }
                  const msgLower = message.toLowerCase();
                  
                  // Comprehensive pattern matching for all Razorpay-related errors
                  return (
                    // Localhost port errors
                    msgLower.includes('localhost:7070') ||
                    msgLower.includes('localhost:37857') ||
                    msgLower.includes('localhost:7071') ||
                    // CORS errors
                    (msgLower.includes('cors') && (msgLower.includes('razorpay') || msgLower.includes('localhost'))) ||
                    (msgLower.includes('access to image') && msgLower.includes('localhost')) ||
                    (msgLower.includes('permission was denied') && msgLower.includes('localhost')) ||
                    // Unsafe header errors
                    (msgLower.includes('refused to get unsafe header') && msgLower.includes('x-rtb-fingerprint-id')) ||
                    (msgLower.includes('refused to get unsafe header') && msgLower.includes('fingerprint')) ||
                    // Network errors
                    ((msgLower.includes('failed to load resource') || 
                      msgLower.includes('net::err_failed') || 
                      msgLower.includes('net::err_connection_refused') ||
                      msgLower.includes('get http://localhost')) &&
                     (msgLower.includes('localhost:7070') || 
                      msgLower.includes('localhost:37857') || 
                      msgLower.includes('localhost:7071') ||
                      msgLower.includes('.png'))) ||
                    // Permission policy violations
                    (msgLower.includes('permissions policy violation') && msgLower.includes('accelerometer')) ||
                    (msgLower.includes('permission policy') && msgLower.includes('accelerometer')) ||
                    // Service worker errors
                    (msgLower.includes('serviceworker') && msgLower.includes('must be a dictionary')) ||
                    (msgLower.includes('service worker') && msgLower.includes('dictionary')) ||
                    // Razorpay API errors
                    (msgLower.includes('502') && msgLower.includes('razorpay')) ||
                    (msgLower.includes('bad gateway') && msgLower.includes('razorpay')) ||
                    (msgLower.includes('validate/account') && msgLower.includes('razorpay')) ||
                    // Image loading errors from Razorpay
                    (msgLower.includes('image') && msgLower.includes('localhost') && (msgLower.includes('7070') || msgLower.includes('37857') || msgLower.includes('7071'))) ||
                    // Paytm scheme errors (harmless)
                    (msgLower.includes('failed to launch') && msgLower.includes('paytmmp://')) ||
                    // v2-entry.modern.js errors (Razorpay internal)
                    (msgLower.includes('v2-entry.modern.js') && (msgLower.includes('fingerprint') || msgLower.includes('localhost')))
                  );
                };
                
                const suppressIfNeeded = function(originalFn, args) {
                  try {
                    const message = Array.from(args).map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg && typeof arg === 'object') {
                        try {
                          return JSON.stringify(arg);
                        } catch(e) {
                          return String(arg);
                        }
                      }
                      return String(arg);
                    }).join(' ');
                    if (shouldSuppress(message)) return;
                    originalFn.apply(console, args);
                  } catch(e) {
                    // If suppression fails, still call original
                    originalFn.apply(console, args);
                  }
                };
                
                // Override all console methods
                console.error = function() {
                  suppressIfNeeded(originalError, arguments);
                };
                
                console.warn = function() {
                  suppressIfNeeded(originalWarn, arguments);
                };
                
                console.log = function() {
                  suppressIfNeeded(originalLog, arguments);
                };
                
                console.info = function() {
                  suppressIfNeeded(originalInfo, arguments);
                };
                
                console.dir = function() {
                  suppressIfNeeded(originalDir, arguments);
                };
                
                console.table = function() {
                  suppressIfNeeded(originalTable, arguments);
                };
                
                // Catch global errors with comprehensive message extraction
                window.addEventListener('error', function(event) {
                  try {
                    const message = (
                      event.message || 
                      event.error?.toString() || 
                      event.filename || 
                      event.target?.src ||
                      event.target?.href ||
                      ''
                    ).toLowerCase();
                    if (shouldSuppress(message)) {
                      event.preventDefault();
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                      return false;
                    }
                  } catch(e) {
                    // Ignore errors in error handler
                  }
                }, true);
                
                window.addEventListener('unhandledrejection', function(event) {
                  try {
                    const message = (
                      event.reason?.toString() || 
                      event.reason?.message ||
                      String(event.reason) ||
                      ''
                    ).toLowerCase();
                    if (shouldSuppress(message)) {
                      event.preventDefault();
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                      return false;
                    }
                  } catch(e) {
                    // Ignore errors in error handler
                  }
                }, true);
                
                // Also intercept XMLHttpRequest errors
                if (window.XMLHttpRequest) {
                  const originalOpen = XMLHttpRequest.prototype.open;
                  const originalSend = XMLHttpRequest.prototype.send;
                  
                  XMLHttpRequest.prototype.open = function(method, url) {
                    this._url = url;
                    return originalOpen.apply(this, arguments);
                  };
                  
                  XMLHttpRequest.prototype.send = function() {
                    if (this._url && shouldSuppress(this._url.toLowerCase())) {
                      // Suppress the request silently
                      this.onerror = function() {};
                      this.onload = function() {};
                      return;
                    }
                    return originalSend.apply(this, arguments);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-body`}>
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
          {/* Used by legacy shadcn/ui toast hook */}
          <ShadcnToaster />
          {/* Used by `sonner` toasts (many pages/components rely on this) */}
          <SonnerToaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
