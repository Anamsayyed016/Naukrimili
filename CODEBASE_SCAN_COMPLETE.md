# 🔍 Complete Codebase Scan Report - Job Portal

**Scan Date:** January 2025  
**Project:** Job Portal (NaukriMili.com)  
**Framework:** Next.js 15.5.2 with TypeScript  
**Production URL:** https://naukrimili.com

---

## 📊 Executive Summary

A comprehensive job portal platform built with Next.js featuring:
- **Job Search & Filtering**: Multi-source job aggregation with AI-powered suggestions
- **Resume Builder**: ATS-optimized resume builder with AI enhancements
- **User Authentication**: NextAuth.js with OAuth (Google) and credentials
- **Company Profiles**: Company listings and job postings
- **Application Tracking**: Full application management system
- **Real-time Notifications**: Socket.io-based notification system
- **Admin Dashboard**: Comprehensive admin panel with analytics
- **Mobile Support**: Responsive design with mobile-specific optimizations

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript (relaxed strict mode)
- **Styling**: Tailwind CSS 4.1.14
- **UI Components**: 
  - Radix UI (comprehensive component library)
  - shadcn/ui (49 UI component files)
  - Custom components
- **State Management**: 
  - React Context (AuthContext, CandidateContext)
  - TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React, Heroicons, React Icons
- **Animations**: Framer Motion
- **PDF/DOCX**: jsPDF, docx, pdf-parse, mammoth

### **Backend**
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL with Prisma ORM 6.13.0
- **Authentication**: NextAuth.js 4.24.11
- **File Storage**: 
  - Google Cloud Storage (primary)
  - Local storage (fallback)
- **Caching**: Redis (ioredis)
- **Search**: Typesense (optional search engine)
- **Real-time**: Socket.io 4.8.1

### **AI & External Services**
- **AI Providers**: 
  - OpenAI 5.20.0
  - Google Gemini (@google/generative-ai 0.24.1)
- **Job Data Sources**: 
  - Adzuna API
  - JSearch (RapidAPI)
  - Indeed
  - ZipRecruiter
  - Jooble
  - Google Jobs API
- **Email**: Gmail OAuth2 (replaced SMTP)
- **Analytics**: Custom analytics system with event tracking

---

## 🏗️ Architecture Overview

### **Project Structure**

```
jobportal/
├── app/                          # Next.js 15 App Router
│   ├── api/                     # 190+ API route handlers
│   │   ├── admin/               # Admin endpoints
│   │   ├── ai/                  # AI-powered endpoints
│   │   ├── auth/                # Authentication routes
│   │   ├── jobs/                # Job-related APIs (36 files)
│   │   ├── resumes/             # Resume management (17 files)
│   │   ├── resume-builder/      # Resume builder APIs (8 files)
│   │   ├── employer/            # Employer-specific APIs
│   │   ├── jobseeker/           # Job seeker APIs
│   │   ├── notifications/       # Notification system
│   │   └── search/              # Search functionality
│   ├── auth/                    # Authentication pages
│   ├── dashboard/               # User dashboards
│   │   ├── admin/               # Admin dashboard
│   │   ├── jobseeker/           # Job seeker dashboard
│   │   └── company/             # Company dashboard
│   ├── jobs/                    # Job listing pages
│   ├── companies/               # Company profiles
│   ├── resumes/                 # Resume management
│   ├── resume-builder/          # Resume builder interface
│   └── employer/                # Employer pages
├── components/                   # React components
│   ├── resume-builder/          # Resume builder components
│   │   ├── form-inputs/        # Form input components (8 files)
│   │   ├── steps/              # Step components (6 files)
│   │   └── [other components]
│   ├── auth/                    # Authentication components
│   ├── ui/                      # Reusable UI components (49 files)
│   ├── jobs/                    # Job-related components
│   ├── dashboard/               # Dashboard components
│   └── admin/                   # Admin components
├── lib/                          # Utility libraries
│   ├── prisma.ts                # Database client
│   ├── nextauth-config.ts       # Auth configuration
│   ├── jobs/                    # Job processing utilities (16 files)
│   ├── services/                # Business logic services (15 files)
│   ├── resume-builder/          # Resume builder utilities
│   ├── storage/                 # File storage utilities
│   ├── notifications/           # Notification services
│   └── analytics/               # Analytics utilities
├── prisma/                       # Database schema
│   └── schema.prisma            # Main database schema (605 lines)
├── types/                        # TypeScript definitions (30+ files)
├── hooks/                        # Custom React hooks (15 files)
├── context/                      # React Context providers
├── middleware/                   # Next.js middleware
└── scripts/                      # Utility scripts (100+ files)
```

---

## 🗄️ Database Schema (Prisma)

### **Core Models**

1. **User** - User accounts with role-based access
   - Supports jobseeker, employer, admin roles
   - OAuth integration (Google)
   - Profile management
   - Resume associations

2. **Job** - Job listings
   - Multi-source support (manual, Adzuna, etc.)
   - Rich metadata (salary, location, skills, etc.)
   - Application tracking
   - Bookmarking support

3. **Company** - Company profiles
   - Structured address fields (Google JobPosting schema)
   - Industry, size, location data
   - Job associations

4. **Resume** - Resume management
   - File storage (PDF/DOCX)
   - Parsed data (JSON)
   - ATS scoring
   - Builder-generated resumes

5. **Application** - Job applications
   - Status tracking
   - Resume attachments
   - Cover letters
   - Notes and favorites

6. **Notification** - User notifications
   - Type-based notifications
   - Read/unread tracking
   - JSON metadata

7. **Message** - User messaging system
   - Direct messages between users
   - Read status tracking

8. **SearchHistory** - Search analytics
   - Query tracking
   - Filter persistence
   - Result counts

### **Additional Models**
- Account (OAuth accounts)
- Session (user sessions)
- JobBookmark
- Category
- Settings
- StaticContent
- ResumeView (analytics)
- MobileError (error tracking)
- NormalizedJob (normalized job data)
- AnalyticsEvent (event tracking)
- AnalyticsAggregation (aggregated metrics)
- OtpVerification (OTP system)
- ContactMessage

**Total**: 20+ models with comprehensive relationships

---

## 🔑 Key Features

### **1. Job Search & Discovery**
- Multi-source job aggregation
- Advanced filtering (location, salary, job type, experience)
- AI-powered job suggestions
- Search history tracking
- Bookmarking system
- Location-based search
- Google Jobs API fallback

### **2. Resume Builder**
- **Multi-step form** with 6 steps:
  - Personal Information
  - Professional Summary/Career Objective
  - Experience
  - Education
  - Skills
  - Additional (Projects, Certifications, Achievements)
- **ATS Optimization**:
  - AI-powered keyword suggestions
  - Real-time ATS scoring
  - Field-specific suggestions (InputWithATS component)
  - Template selection
- **Export Options**:
  - PDF export
  - DOCX export
  - Multiple templates
- **AI Enhancements**:
  - Form auto-suggestions
  - Keyword optimization
  - Experience level-based customization

### **3. Authentication System**
- NextAuth.js integration
- **OAuth Providers**: Google
- **Credentials**: Email/password
- **OTP System**: Phone/email verification
- Role-based access control (jobseeker, employer, admin)
- Session management
- Regional OAuth support

### **4. Application Management**
- Application tracking
- Status management (submitted, reviewed, accepted, rejected)
- Resume attachments
- Cover letter support
- Favorite applications
- Application analytics

### **5. Notification System**
- Real-time notifications via Socket.io
- Email notifications (Gmail OAuth2)
- In-app notification bell
- Role-based notifications
- Notification preferences

### **6. Admin Dashboard**
- User management
- Job moderation
- Application management
- Analytics dashboard
- System health monitoring
- Category management
- Contact message handling

### **7. Company Features**
- Company profile management
- Job posting
- Application management
- Analytics and stats
- Resume viewing

### **8. Job Seeker Features**
- Profile management
- Resume upload and management
- Application tracking
- Job recommendations
- Search history

---

## 📡 API Endpoints Overview

### **Job APIs** (36 endpoints)
- `/api/jobs` - Job listings
- `/api/jobs/[id]` - Job details
- `/api/jobs/search` - Search jobs
- `/api/jobs/unlimited` - Unlimited job search
- `/api/jobs/import` - Import jobs from external sources
- `/api/jobs/categories` - Job categories
- `/api/jobs/bookmarks` - Job bookmarks

### **Resume APIs** (17 endpoints)
- `/api/resumes/upload` - Upload resume
- `/api/resumes/[id]` - Resume management
- `/api/resumes/analyze` - AI resume analysis
- `/api/resumes/autofill` - Form auto-fill
- `/api/resumes/generate` - Generate resume

### **Resume Builder APIs** (8 endpoints)
- `/api/resume-builder/save` - Save resume
- `/api/resume-builder/ats-suggestions` - ATS keyword suggestions
- `/api/resume-builder/ai-enhance` - AI enhancement
- `/api/resume-builder/export/pdf` - PDF export
- `/api/resume-builder/export/docx` - DOCX export
- `/api/resume-builder/templates` - Template management

### **Authentication APIs**
- `/api/auth/[...nextauth]` - NextAuth handler
- `/api/auth/register` - User registration
- `/api/auth/verify-email` - Email verification
- `/api/auth/set-role` - Role selection

### **Admin APIs**
- `/api/admin/*` - Admin endpoints
- `/api/admin/jobs` - Job management
- `/api/admin/users` - User management
- `/api/admin/applications` - Application management
- `/api/admin/stats` - Analytics

### **Employer APIs**
- `/api/employer/jobs` - Job posting
- `/api/employer/applications` - Application management
- `/api/employer/analytics` - Analytics

### **AI APIs**
- `/api/ai/form-suggestions` - Form suggestions
- `/api/ai/job-suggestions` - Job suggestions
- `/api/ai/company-suggestions` - Company suggestions

**Total**: 190+ API route handlers

---

## 🎨 Component Architecture

### **Resume Builder Components**

1. **Form Inputs** (`components/resume-builder/form-inputs/`)
   - `InputWithATS.tsx` - Input with AI suggestions (312 lines)
   - `TextareaWithATS.tsx` - Textarea with AI suggestions
   - `SearchableSelect.tsx` - Searchable dropdown (242 lines)
   - Other form components

2. **Steps** (`components/resume-builder/steps/`)
   - `PersonalInfoStep.tsx` - Personal information
   - `SummaryStep.tsx` - Summary/Objective
   - `ExperienceStep.tsx` - Work experience (149 lines)
   - `EducationStep.tsx` - Education
   - `SkillsStep.tsx` - Skills
   - `AdditionalStep.tsx` - Additional information

3. **Core Components**
   - `ResumeBuilderStart.tsx` - Builder entry point
   - `LivePreview.tsx` - Live preview
   - `TemplateCard.tsx` - Template selection
   - `KeywordSuggestionPanel.tsx` - Keyword suggestions
   - `EditorStepper.tsx` - Step navigation

### **UI Components** (49 files)
- Comprehensive shadcn/ui component library
- Custom components for specific use cases
- Responsive design components

### **Job Components**
- `EnhancedJobCard.tsx` - Job card display
- `UnifiedJobSearch.tsx` - Search interface
- `JobApplication.tsx` - Application form
- `LocationBasedJobSearch.tsx` - Location search

---

## 🔧 Configuration Files

### **Next.js Configuration** (`next.config.mjs`)
- React strict mode enabled
- TypeScript/ESLint errors ignored during builds
- Webpack configuration for server-only packages
- Image optimization (Cloudinary, Icons8)
- Cache headers configuration

### **TypeScript Configuration** (`tsconfig.json`)
- Relaxed strict mode (development-friendly)
- Path aliases (`@/*`)
- ES2020 target
- Bundler module resolution

### **Prisma Configuration** (`prisma/schema.prisma`)
- PostgreSQL database
- Comprehensive schema with 20+ models
- Indexed fields for performance
- Relationship definitions

---

## 🚀 Deployment

### **Production Setup**
- **Hosting**: Hostinger VPS
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions
- **Domain**: naukrimili.com

### **Deployment Scripts**
- Multiple deployment scripts for different scenarios
- Windows and Linux support
- Automated build and deployment
- Environment management

### **Build Configuration**
- Multiple build variants (production, optimized, fast)
- Memory optimization (up to 8GB)
- Cache busting strategies
- Build validation

---

## 📊 Code Statistics

- **Total API Routes**: 190+
- **Components**: 100+ React components
- **Database Models**: 20+
- **TypeScript Types**: 30+ type definition files
- **Custom Hooks**: 15+
- **Utility Scripts**: 100+
- **Lines of Code**: Estimated 50,000+ lines

---

## 🔐 Security Features

- NextAuth.js authentication
- CSRF protection
- Rate limiting
- Input validation (Zod)
- File upload security
- OAuth security enhancements
- Session management
- Cross-account protection

---

## 📱 Mobile Support

- Responsive design
- Mobile-specific components
- Mobile error tracking
- Mobile OAuth optimizations
- Geolocation support
- Mobile notification system

---

## 🧪 Testing

- Jest configuration
- Unit tests
- Integration tests
- Test utilities and mocks

---

## 📝 Documentation

- Multiple markdown documentation files
- API documentation
- Deployment guides
- Implementation summaries
- Troubleshooting guides

---

## 🔄 Recent Development Focus

Based on file structure and documentation:
1. **Resume Builder Enhancements**: ATS optimization, AI suggestions
2. **OAuth Improvements**: Gmail OAuth2, regional OAuth
3. **Job Search**: Multi-source integration, unlimited search
4. **Mobile Optimization**: Mobile-specific fixes and optimizations
5. **Notification System**: Real-time notifications, Socket.io integration
6. **Admin Features**: Enhanced admin dashboard, analytics

---

## 🎯 Key Strengths

1. **Comprehensive Feature Set**: Full job portal functionality
2. **Modern Tech Stack**: Next.js 15, TypeScript, Prisma
3. **AI Integration**: Multiple AI-powered features
4. **Scalable Architecture**: Well-structured codebase
5. **Production Ready**: Deployed and running
6. **Extensive API**: 190+ endpoints for various features

---

## ⚠️ Areas for Improvement

1. **Code Organization**: Many backup files and scripts in root
2. **TypeScript Strictness**: Relaxed strict mode (development vs production)
3. **Documentation**: Could benefit from more inline documentation
4. **Testing**: Expand test coverage
5. **Error Handling**: Standardize error handling patterns

---

## 📚 Key Files to Review

### **Core Application**
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `middleware.ts` - Next.js middleware

### **Authentication**
- `lib/nextauth-config.ts` - Auth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth handler

### **Database**
- `prisma/schema.prisma` - Database schema
- `lib/prisma.ts` - Database client

### **Resume Builder**
- `components/resume-builder/form-inputs/InputWithATS.tsx` - ATS input component
- `components/resume-builder/steps/ExperienceStep.tsx` - Experience step

### **Job Search**
- `app/api/jobs/route.ts` - Job listings API
- `components/UnifiedJobSearch.tsx` - Search component

---

## 🔗 External Integrations

1. **Job APIs**: Adzuna, JSearch, Indeed, ZipRecruiter, Jooble, Google Jobs
2. **AI Services**: OpenAI, Google Gemini
3. **Storage**: Google Cloud Storage
4. **Email**: Gmail OAuth2
5. **Search**: Typesense (optional)
6. **Caching**: Redis

---

## 📈 Performance Optimizations

- Image optimization
- Code splitting
- Caching strategies
- Database indexing
- API response caching
- Build optimizations

---

**End of Codebase Scan Report**

