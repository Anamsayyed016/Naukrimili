import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { ScrollOptimization } from './layout-scroll-optimization';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jobs - Recruitment - Job Search - Employment - Free Resume Builder | Naukrimili',
  description: 'Find the latest jobs in India, USA, UK, and UAE on Naukrimili. Build your free professional resume and apply for top companies worldwide.',
  keywords: 'jobs, recruitment, job search, employment, resume builder, naukrimili, hiring, vacancies, careers, openings, India jobs, USA jobs, UK jobs, UAE jobs',
  authors: [{ name: 'Naukrimili' }],
  creator: 'Naukrimili',
  publisher: 'Naukrimili',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://naukrimili.com',
    siteName: 'Naukrimili',
    title: 'Jobs - Recruitment - Job Search - Employment - Free Resume Builder | Naukrimili',
    description: 'Find the latest jobs in India, USA, UK, and UAE on Naukrimili. Build your free professional resume and apply for top companies worldwide.',
    images: [
      {
        url: 'https://res.cloudinary.com/dko2hk0yo/image/upload/f_png,e_make_transparent:20/v1762546509/1naukkkLogo_gw9g5z.jpg',
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
    images: ['https://res.cloudinary.com/dko2hk0yo/image/upload/f_png,e_make_transparent:20/v1762546509/1naukkkLogo_gw9g5z.jpg'],
    creator: '@naukrimili',
    site: '@naukrimili',
  },
  alternates: {
    canonical: 'https://naukrimili.com',
    languages: {
      'en-IN': 'https://naukrimili.com/en-in',
      'en-US': 'https://naukrimili.com/en-us',
      'en-GB': 'https://naukrimili.com/en-gb',
      'ar-AE': 'https://naukrimili.com/ar-ae',
    },
  },
  verification: {
    google: 'PASTE_YOUR_GOOGLE_CODE_HERE',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
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
              "url": "https://www.naukrimili.com",
              "logo": "https://res.cloudinary.com/dko2hk0yo/image/upload/f_png,e_make_transparent:20/v1762546509/1naukkkLogo_gw9g5z.jpg",
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
              "url": "https://www.naukrimili.com",
              "description": "Find the latest jobs in India, USA, UK, and UAE. Build your free professional resume and apply for top companies worldwide.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.naukrimili.com/jobs?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Naukrimili",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://res.cloudinary.com/dko2hk0yo/image/upload/f_png,e_make_transparent:20/v1762546509/1naukkkLogo_gw9g5z.jpg"
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
                "url": "https://www.naukrimili.com"
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
                  "item": "https://www.naukrimili.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Jobs",
                  "item": "https://www.naukrimili.com/jobs"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Resume Builder",
                  "item": "https://www.naukrimili.com/resume-builder"
                }
              ]
            })
          }}
        />

        {/* Enhanced GA4 Event Tracking Functions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced tracking functions
              function trackResumeBuilderOpened() {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'resume_builder_opened', {
                    event_category: 'Resume Builder',
                    event_label: 'User opened resume builder',
                    value: 1
                  });
                  console.log('✅ Tracked: Resume Builder Opened');
                }
              }

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
              window.trackResumeBuilderOpened = trackResumeBuilderOpened;
              window.trackResumeDownloaded = trackResumeDownloaded;
              window.trackJobApplied = trackJobApplied;
            `,
          }}
        />

        {/* ✅ Google Analytics + SEO Installed Successfully */}
      </head>
      <body className={`${inter.className} font-body`}>
        <SessionProvider>
          <ScrollOptimization />
          <MainNavigation />
          {children}
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
