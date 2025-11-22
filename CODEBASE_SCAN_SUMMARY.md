# 📊 Job Portal Codebase Scan Summary

**Scan Date:** Generated on-demand  
**Project:** Job Portal (Naukrimili.com)  
**Technology Stack:** Next.js 15, TypeScript, PostgreSQL, Prisma, NextAuth.js

---

## 🏗️ Project Overview

A comprehensive job portal platform built with Next.js featuring:
- Job search and filtering with AI-powered suggestions
- Resume builder with ATS optimization
- Company profiles and job postings
- User authentication with OAuth and credentials
- Application tracking system
- Real-time notifications via Socket.io
- Admin dashboard and analytics

---

## 📁 Project Structure

### Core Directories

```
jobportal/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (100+ endpoints)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboards (admin, jobseeker, employer)
│   ├── jobs/              # Job listing and detail pages
│   ├── companies/         # Company profiles
│   ├── resumes/           # Resume upload and management
│   └── resume-builder/    # Resume builder interface
├── components/            # React components
│   ├── resume-builder/    # Resume builder components
│   ├── auth/              # Authentication components
│   ├── ui/                # Reusable UI components (49 files)
│   └── jobs/              # Job-related components
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Database client
│   ├── nextauth-config.ts # Auth configuration
│   ├── jobs/              # Job processing utilities
│   └── services/          # Business logic services
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Main database schema
│   └── migrations/        # Database migrations
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

---

## 🗄️ Database Schema (Prisma)

### Core Models

1. **User** - User accounts with role-based access
   - Supports multiple roles: jobseeker, employer, admin
   - OAuth integration via Account model
   - Profile completion tracking
   - Role locking mechanism

2. **Job** - Job listings
   - Multi-source support (manual, API integrations)
   - Rich metadata (salary, location, skills, etc.)
   - Views and applications tracking
   - Company relationships

3. **Company** - Company profiles
   - Structured address fields (Google JobPosting compliant)
   - Industry and sector classification
   - Verification system

4. **Application** - Job applications
   - Links users, jobs, companies, and resumes
   - Status tracking (submitted, reviewed, etc.)
   - Favorite applications

5. **Resume** - Resume management
   - File storage (Google Cloud Storage)
   - Parsed data (JSON)
   - ATS score tracking
   - Builder vs. upload distinction

6. **Notification** - User notifications
   - Real-time notification system
   - Type-based categorization
   - Read/unread tracking

7. **SearchHistory** - User search analytics
   - Query tracking
   - Filter storage
   - Result count tracking

8. **NormalizedJob** - Normalized job data
   - Cross-source job standardization
   - Relevance scoring
   - Category confidence metrics

### Supporting Models
- Account (OAuth accounts)
- Session (NextAuth sessions)
- Message (User messaging)
- JobBookmark (Saved jobs)
- ResumeView (Resume view tracking)
- Category (Job categories)
- Settings (User preferences)
- MobileError (Mobile error tracking)

---

## 🔐 Authentication & Authorization

### Authentication System
- **NextAuth.js v4** with JWT strategy
- **Providers:**
  - Google OAuth (with PKCE)
  - Credentials (email/password)
  - Regional OAuth support

### Security Features
- Password hashing (bcryptjs)
- Session management (24-hour expiration)
- CSRF protection
- Rate limiting
- Role-based access control (RBAC)
- AuthGuard component for protected routes

### Role System
- **Jobseeker** - Job search and application
- **Employer** - Job posting and application management
- **Admin** - Platform administration

---

## 🚀 Key Features

### 1. Job Search & Discovery
- Advanced filtering (location, salary, experience, job type)
- AI-powered job recommendations
- Search history tracking
- Trending categories
- Featured jobs
- Location-based search with geolocation

### 2. Resume Builder
- Multiple resume templates
- AI-powered ATS suggestions
- Real-time preview
- Export to PDF/DOCX
- Keyword optimization
- Template customization

### 3. Resume Processing
- PDF/DOCX parsing (pdf-parse, mammoth)
- AI-powered data extraction (OpenAI, Google Gemini)
- Form auto-fill
- ATS compatibility scoring

### 4. Application Management
- Application tracking
- Status updates
- Resume attachment
- Cover letter support
- Application analytics

### 5. Company Profiles
- Company registration and verification
- Job posting interface
- Application management
- Company analytics
- Career page integration

### 6. Notifications System
- Real-time notifications (Socket.io)
- Email notifications (Gmail OAuth2)
- In-app notification bell
- Notification preferences

### 7. Admin Dashboard
- User management
- Job verification queue
- System health monitoring
- Analytics dashboard
- Content management

---

## 🔧 Technology Stack

### Frontend
- **Next.js 15.5.2** (App Router)
- **React 18**
- **TypeScript 5.9.2**
- **Tailwind CSS 4.1.14**
- **Radix UI** (Component library)
- **Framer Motion** (Animations)
- **React Hook Form** (Form management)
- **Zod** (Validation)

### Backend
- **Next.js API Routes**
- **Prisma 6.13.0** (ORM)
- **PostgreSQL** (Database)
- **NextAuth.js 4.24.11** (Authentication)
- **Socket.io** (Real-time)

### AI & Services
- **OpenAI API** (Resume analysis, job suggestions)
- **Google Gemini** (AI enhancements)
- **Google Cloud Storage** (File storage)
- **Gmail API** (Email notifications)
- **Typesense** (Search engine)

### Deployment
- **Hostinger VPS**
- **PM2** (Process management)
- **Nginx** (Reverse proxy)
- **GitHub Actions** (CI/CD)
- **Docker** (Containerization - inferred from configs)

---

## 📊 API Structure

### Main API Routes (`/app/api/`)

#### Authentication (`/api/auth/`)
- `/api/auth/[...nextauth]` - NextAuth handler
- `/api/auth/register` - User registration
- `/api/auth/set-role` - Role assignment
- `/api/auth/verify-email` - Email verification
- `/api/auth/regional/*` - Regional OAuth handlers

#### Jobs (`/api/jobs/`)
- `/api/jobs/route.ts` - Job CRUD operations
- `/api/jobs/[id]/*` - Job-specific endpoints
- `/api/jobs/search` - Advanced job search
- `/api/jobs/featured` - Featured jobs

#### Resumes (`/api/resumes/`)
- `/api/resumes/upload` - Resume upload and parsing
- `/api/resumes/builder/*` - Resume builder endpoints
- `/api/resumes/ats-suggestions` - ATS optimization

#### Applications (`/api/applications/`)
- `/api/applications/route.ts` - Application management

#### Company (`/api/company/`)
- `/api/company/profile` - Company profile management
- `/api/company/jobs` - Company job listings
- `/api/company/applications` - Application management

#### Admin (`/api/admin/`)
- `/api/admin/*` - Admin operations

#### AI Services (`/api/ai/`)
- `/api/ai/form-suggestions` - Form auto-complete
- `/api/ai/job-suggestions` - Job recommendations
- `/api/ai/company-suggestions` - Company matching

---

## 🎨 UI Components

### Component Library (`components/ui/`)
- 49 reusable UI components
- Based on Radix UI
- Tailwind CSS styling
- Fully typed with TypeScript

### Key Custom Components
- `InputWithATS.tsx` - Input with AI suggestions (currently open)
- `ComprehensiveNotificationBell` - Notification system
- `EnhancedJobSearchHero` - Job search interface
- `ResumeBuilderStart` - Resume builder entry
- `AuthGuard` - Route protection
- `MobileErrorBoundary` - Mobile error handling

---

## 🔄 State Management

- **React Query (TanStack Query)** - Server state management
- **React Context** - Auth and theme providers
- **Local State** - React hooks for component state
- **Socket.io Client** - Real-time updates

---

## 📝 Code Quality

### TypeScript Configuration
- Strict mode: **Disabled** (for development flexibility)
- Type checking in CI/CD pipeline
- Comprehensive type definitions in `/types/`

### Testing
- **Jest** configuration present
- Unit and integration test support
- Test setup files configured

### Linting
- **ESLint** configured
- Next.js recommended rules
- Security plugin enabled

---

## 🌐 Deployment Configuration

### Production Setup
- Domain: `naukrimili.com`
- Server: Hostinger VPS
- Process Manager: PM2
- Reverse Proxy: Nginx
- SSL/TLS: HTTPS enabled

### Build Configuration
- Multiple build scripts for different environments
- Optimized build process
- Cache busting strategies
- Chunk optimization

### Environment Variables
- Database connection (DATABASE_URL)
- NextAuth configuration
- OAuth credentials (Google)
- AI API keys (OpenAI, Gemini)
- Storage configuration (GCS)
- Email configuration (Gmail OAuth2)

---

## 🔍 Notable Patterns & Practices

### 1. File Organization
- Feature-based organization in `/app/`
- Shared components in `/components/`
- Utility functions in `/lib/`
- Type definitions centralized in `/types/`

### 2. Database Access
- Prisma client singleton pattern
- Server-only utilities for database access
- Query optimization with indexes

### 3. Error Handling
- Custom error boundaries
- Mobile-specific error tracking
- Comprehensive error logging
- User-friendly error messages

### 4. Performance Optimizations
- Image optimization (Next.js Image)
- Code splitting
- Lazy loading
- API response caching
- Database query optimization

### 5. Security Practices
- Input validation (Zod schemas)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (DOMPurify)
- CSRF tokens
- Rate limiting
- Security headers in middleware

---

## 📈 Analytics & Tracking

- Search history tracking
- Job view analytics
- Application analytics
- Resume view tracking
- User activity logging
- Redirect tracking
- Real-time dashboard support

---

## 🐛 Known Areas for Improvement

1. **Code Organization**
   - Many backup/old files in root directory
   - Multiple NextAuth config backup files
   - Could benefit from cleanup

2. **Type Safety**
   - Strict TypeScript mode disabled
   - Some `any` types in use
   - Could be improved gradually

3. **Documentation**
   - Extensive documentation files present
   - Some redundancy in docs
   - API documentation could be centralized

4. **Testing**
   - Test setup present but coverage unclear
   - Could benefit from more integration tests

---

## 🔗 External Integrations

1. **Job Data Sources**
   - Multiple job aggregation APIs
   - Custom job scraping
   - Manual job posting

2. **AI Services**
   - OpenAI (GPT models)
   - Google Gemini
   - ATS optimization algorithms

3. **Storage**
   - Google Cloud Storage (Resume files)
   - Cloudinary (Images)

4. **Email**
   - Gmail OAuth2 for sending emails
   - Email templates system

5. **Search**
   - Typesense for advanced search
   - PostgreSQL full-text search

---

## 📚 Documentation Files

The codebase includes extensive documentation:
- Implementation guides
- Deployment guides
- Feature documentation
- Troubleshooting guides
- API setup guides
- OAuth configuration guides

---

## ✅ Current Status

The codebase appears to be:
- **Production-ready** with active deployment
- **Actively maintained** with recent updates
- **Feature-complete** for a job portal platform
- **Well-structured** with clear separation of concerns
- **Scalable** architecture with modern patterns

---

## 🎯 Summary

This is a **mature, production-grade job portal application** built with modern web technologies. The codebase demonstrates:

- ✅ Comprehensive feature set
- ✅ Robust authentication system
- ✅ AI-powered enhancements
- ✅ Real-time capabilities
- ✅ Mobile-friendly design
- ✅ Admin capabilities
- ✅ Production deployment

The application supports the full job search and application workflow for both jobseekers and employers, with advanced features like AI-powered resume optimization, real-time notifications, and comprehensive analytics.

