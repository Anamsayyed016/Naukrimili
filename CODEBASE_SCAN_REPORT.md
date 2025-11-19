# 🔍 Codebase Scan Report - Job Portal

**Scan Date:** January 2025  
**Project:** Job Portal (NaukriMili.com)  
**Framework:** Next.js 15.5.2 with TypeScript

---

## 📊 Project Overview

A comprehensive job portal platform built with Next.js featuring:
- Job search and filtering with multiple data sources
- AI-powered resume analysis and builder
- User authentication (NextAuth.js with OAuth)
- Company profiles and job postings
- Application tracking system
- Real-time notifications
- Admin dashboard

**Production URL:** https://naukrimili.com

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 15.5.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.1.14
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** React Context, TanStack Query
- **Forms:** React Hook Form with Zod validation
- **Icons:** Lucide React, Heroicons

### **Backend**
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js 4.24.11
- **File Storage:** Google Cloud Storage + Local storage
- **Caching:** Redis (ioredis)
- **Search:** Typesense (optional)

### **AI & External Services**
- **AI Providers:** OpenAI, Google Gemini
- **Job APIs:** Adzuna, JSearch (RapidAPI), Indeed, ZipRecruiter, Jooble, Google Jobs
- **Email:** Gmail OAuth2 (replaced SMTP)
- **Real-time:** Socket.io

---

## 🏗️ Architecture

### **Project Structure**
```
jobportal/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST endpoints)
│   ├── auth/              # Authentication pages
│   ├── jobs/              # Job listing pages
│   ├── companies/         # Company pages
│   ├── dashboard/         # User dashboards
│   ├── resumes/           # Resume management
│   └── admin/             # Admin panel
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── jobs/             # Job-related components
│   ├── resume/           # Resume components
│   └── auth/             # Auth components
├── lib/                   # Utility libraries
│   ├── jobs/             # Job search services
│   ├── storage/          # File storage services
│   ├── services/         # Business logic services
│   └── prisma.ts         # Database client
├── prisma/               # Database schema
├── types/                # TypeScript definitions
├── hooks/                # Custom React hooks
└── middleware.ts         # Next.js middleware
```

### **Authentication Flow**
1. User clicks "Sign in with Google" → NextAuth.js intercepts
2. Redirects to Google OAuth consent screen
3. User authorizes → Google redirects back with code
4. NextAuth exchanges code for access token
5. User profile fetched → User created/updated in DB
6. Session created → Redirect to role selection (`/roles/choose`)

**Providers:** Google OAuth, GitHub OAuth, Credentials (email/password)

---

## 🗄️ Database Schema (Prisma)

### **Core Models**

#### **User Management**
- `User` - User accounts with role-based access
- `Account` - OAuth account linking
- `Session` - User sessions
- `VerificationToken` - Email verification
- `OtpVerification` - Phone OTP verification

#### **Job System**
- `Job` - Job postings with comprehensive metadata
- `Company` - Company profiles
- `Application` - Job applications
- `JobBookmark` - Saved jobs
- `Category` - Job categories

#### **Resume System**
- `Resume` - User resumes (PDF/DOCX)
- `ResumeView` - Resume view tracking

#### **Communication**
- `Message` - User-to-user messaging
- `Notification` - System notifications

#### **Analytics & Tracking**
- `SearchHistory` - User search queries
- `AnalyticsEvent` - Event tracking
- `AnalyticsAggregation` - Aggregated metrics
- `MobileError` - Mobile error logging

#### **Other**
- `Settings` - User preferences
- `StaticContent` - CMS content
- `ContactMessage` - Contact form submissions
- `NormalizedJob` - Normalized job data from external APIs

**Total Models:** 20+ tables with proper indexing

---

## 🔌 API Structure

### **Authentication APIs**
- `POST /api/auth/register` - User registration
- `POST /api/auth/register/jobseeker` - Job seeker registration
- `POST /api/auth/register/employer` - Employer registration
- `GET /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/auth/set-role` - Set user role
- `POST /api/auth/verify-email` - Email verification

### **Job APIs**
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/[id]` - Job details
- `GET /api/jobs/unified` - Unified job search
- `GET /api/jobs/advanced` - Advanced search
- `POST /api/jobs/import` - Import jobs from external APIs
- `GET /api/jobs/featured` - Featured jobs

### **Resume APIs**
- `POST /api/resumes/upload` - Basic upload
- `POST /api/resumes/enhanced-upload` - Enhanced upload with AI
- `POST /api/resumes/ultimate-upload` - Ultimate upload (GCS + AI)
- `POST /api/resumes/autofill` - AI-powered form autofill
- `GET /api/resumes/[id]` - Get resume
- `GET /api/resumes/[id]/download` - Download resume
- `GET /api/resumes/[id]/stats` - Resume statistics

### **Application APIs**
- `POST /api/applications` - Submit application
- `GET /api/applications` - List applications
- `GET /api/applications/[id]` - Application details

### **Company APIs**
- `GET /api/companies` - List companies
- `GET /api/companies/[id]` - Company details
- `GET /api/company/jobs` - Company jobs
- `GET /api/company/applications` - Company applications

### **Search APIs**
- `GET /api/search` - General search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/enhanced` - Enhanced search

### **Admin APIs**
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/jobs` - Admin job management
- `GET /api/admin/users` - User management
- `GET /api/admin/applications` - Application management

### **Other APIs**
- `GET /api/notifications` - User notifications
- `GET /api/messages` - User messages
- `GET /api/analytics/events` - Analytics events
- `GET /api/health` - Health check

---

## 🔗 External Integrations

### **Job Data Sources** (6 APIs)
1. **Adzuna** - India, UK, US, UAE (requires API key)
2. **JSearch (RapidAPI)** - Global job search
3. **Indeed (RapidAPI)** - Global job search
4. **ZipRecruiter (RapidAPI)** - Global job search
5. **Jooble** - India, Global (requires API key)
6. **Google Jobs** - Global (RapidAPI subscription)

### **AI Services**
- **OpenAI API** - Resume analysis, job suggestions
- **Google Gemini API** - Fallback AI provider

### **Storage**
- **Google Cloud Storage** - Resume file storage
- **Local Storage** - Fallback for development

### **Email**
- **Gmail OAuth2** - Email notifications (replaced SMTP)

### **Real-time**
- **Socket.io** - Real-time notifications

---

## 🎯 Key Features

### **Job Search & Filtering**
- ✅ Multi-field text search (title, description, company, skills)
- ✅ Location-based filtering (city, state, country)
- ✅ Salary range filtering
- ✅ Job type filtering (full-time, part-time, contract)
- ✅ Experience level filtering
- ✅ Remote/Hybrid filtering
- ✅ Sector/Industry filtering
- ✅ Pagination with configurable limits
- ✅ Sorting (relevance, date, salary)
- ✅ Search history tracking

### **Resume Management**
- ✅ PDF/DOCX/TXT upload
- ✅ AI-powered resume parsing (OpenAI/Gemini)
- ✅ ATS score calculation
- ✅ Resume builder (in progress)
- ✅ Resume download/export
- ✅ Resume view tracking
- ✅ Multiple resume versions

### **User Features**
- ✅ OAuth authentication (Google, GitHub)
- ✅ Email/password authentication
- ✅ Role-based access (Job Seeker, Employer, Admin)
- ✅ Profile management
- ✅ Job bookmarking
- ✅ Application tracking
- ✅ Notification system
- ✅ Messaging system

### **Company Features**
- ✅ Company profiles
- ✅ Job posting
- ✅ Application management
- ✅ Analytics dashboard

### **Admin Features**
- ✅ User management
- ✅ Job moderation
- ✅ Application management
- ✅ System health monitoring
- ✅ Analytics dashboard

---

## 📁 Key Files & Components

### **Configuration**
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema
- `middleware.ts` - Request middleware

### **Authentication**
- `lib/nextauth-config.ts` - NextAuth configuration
- `components/auth/OAuthButtons.tsx` - OAuth buttons
- `app/api/auth/[...nextauth]/route.ts` - Auth handler

### **Job Search**
- `lib/jobs/unlimited-search.ts` - Unlimited job search
- `lib/jobs/real-job-search.ts` - Real job search
- `lib/jobs/optimized-search.ts` - Optimized search
- `lib/services/job-search-service.ts` - Job search service
- `app/api/jobs/route.ts` - Jobs API endpoint

### **Resume Processing**
- `lib/enhanced-resume-ai.ts` - Enhanced AI resume parser
- `lib/dynamic-resume-ai.ts` - Dynamic AI parser
- `lib/hybrid-resume-ai.ts` - Hybrid AI parser
- `lib/pdf-extractor.ts` - PDF text extraction
- `app/api/resumes/ultimate-upload/route.ts` - Resume upload endpoint

### **Storage**
- `lib/storage/google-cloud-storage.ts` - GCS integration
- `lib/storage/resume-storage.ts` - Unified storage service

### **UI Components**
- `components/MainNavigation.tsx` - Main navigation
- `components/EnhancedJobCard.tsx` - Job card component
- `components/resume/ResumeUpload.tsx` - Resume upload component
- `components/dashboards/JobSeekerDashboard.tsx` - Job seeker dashboard

---

## 🔒 Security Features

- ✅ CORS configuration for production domain
- ✅ Secure cookie settings (production)
- ✅ CSRF protection
- ✅ Rate limiting (Redis-based)
- ✅ Input validation (Zod schemas)
- ✅ File upload validation
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection headers
- ✅ Content Security Policy (CSP)

---

## 🚀 Deployment

### **Production Environment**
- **Hosting:** Hostinger VPS
- **Process Manager:** PM2
- **Domain:** naukrimili.com
- **CI/CD:** GitHub Actions
- **Database:** PostgreSQL (production)

### **Build Scripts**
- `npm run build` - Production build
- `npm run build:production` - Production build script
- `npm run deploy:server` - Server deployment
- `npm run deploy:pm2` - PM2 deployment

### **Environment Variables**
Key environment variables required:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - NextAuth URL
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `OPENAI_API_KEY` - OpenAI API
- `GEMINI_API_KEY` - Gemini API
- `GCS_BUCKET_NAME` - Google Cloud Storage
- Various job API keys

---

## 📝 Notable Patterns & Practices

### **Code Organization**
- ✅ Feature-based folder structure
- ✅ Separation of concerns (API, components, lib)
- ✅ TypeScript for type safety
- ✅ Reusable UI components (shadcn/ui)

### **Performance Optimizations**
- ✅ Database query optimization with indexes
- ✅ Redis caching for job searches
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting and lazy loading
- ✅ Static generation where possible

### **Error Handling**
- ✅ Try-catch blocks in API routes
- ✅ Error boundaries in React components
- ✅ Mobile error logging
- ✅ Comprehensive error messages

### **Testing**
- ✅ Jest configuration
- ✅ Unit tests
- ✅ Integration tests
- ✅ Test utilities

---

## ⚠️ Known Issues & Areas for Improvement

### **Code Quality**
- ⚠️ Many backup files in root directory (cleanup needed)
- ⚠️ Multiple deployment scripts (consolidation needed)
- ⚠️ Some duplicate code in job search services
- ⚠️ TypeScript strict mode disabled

### **Documentation**
- ⚠️ Some API endpoints lack documentation
- ⚠️ Complex business logic needs better comments
- ⚠️ Environment variable documentation incomplete

### **Performance**
- ⚠️ Large bundle size (needs optimization)
- ⚠️ Some N+1 query issues in job listings
- ⚠️ Cache invalidation strategy needs improvement

### **Security**
- ⚠️ Some API endpoints lack rate limiting
- ⚠️ File upload size limits need review
- ⚠️ OAuth error handling could be improved

---

## 📊 Statistics

- **Total API Routes:** 100+ endpoints
- **Database Models:** 20+ tables
- **React Components:** 150+ components
- **External Integrations:** 10+ services
- **Lines of Code:** ~50,000+ (estimated)

---

## 🎓 Learning Resources

### **Key Technologies Used**
- Next.js App Router documentation
- Prisma ORM documentation
- NextAuth.js documentation
- Tailwind CSS documentation
- Radix UI components

### **Project-Specific Docs**
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - Structure documentation
- Various implementation summaries in root directory

---

## 🔄 Recent Changes

Based on file timestamps and documentation:
- ✅ Gmail OAuth2 implementation (replaced SMTP)
- ✅ Google Cloud Storage integration
- ✅ Multiple job API integrations (6 providers)
- ✅ AI resume analysis (OpenAI + Gemini)
- ✅ Mobile OAuth fixes
- ✅ Resume builder implementation (in progress)
- ✅ Admin dashboard enhancements

---

## 📞 Support & Maintenance

### **Key Areas to Monitor**
1. **Database Performance** - Query optimization, indexing
2. **API Rate Limits** - External API usage tracking
3. **Storage Costs** - GCS usage monitoring
4. **Error Logs** - Mobile errors, API errors
5. **User Analytics** - Search patterns, feature usage

### **Regular Maintenance Tasks**
- Database backups
- Dependency updates
- Security patches
- Performance monitoring
- Error log review

---

**End of Report**

