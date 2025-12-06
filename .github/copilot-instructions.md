# Naukrimili Job Portal - AI Coding Agent Instructions

## Project Overview
**Naukrimili** is a full-stack job portal application built with Next.js 15, featuring job search, resume management, AI-powered resume parsing, and multi-role authentication (jobseeker, employer, admin).

### Key Technologies
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS 4, Radix UI
- **Backend**: Node.js, NextAuth.js 4 (OAuth + Credentials), Prisma ORM
- **Database**: PostgreSQL with complex relationships (User, Job, Company, Application, Resume)
- **File Storage**: Google Cloud Storage + Local storage for resume PDFs
- **AI Services**: OpenAI, Google Gemini for resume parsing and ATS optimization
- **Search**: Typesense (optional), full-text search capabilities
- **Real-time**: Socket.io for notifications, Ably for messaging

---

## Critical Architecture Patterns

### 1. **Singleton Service Pattern** (lib/services/)
All major services use singleton instances with `getInstance()`. Example:
```typescript
// ✅ CORRECT - Job Processing Middleware
export class JobProcessingMiddleware {
  private static instance: JobProcessingMiddleware;
  public static getInstance(): JobProcessingMiddleware {
    if (!JobProcessingMiddleware.instance) {
      JobProcessingMiddleware.instance = new JobProcessingMiddleware();
    }
    return JobProcessingMiddleware.instance;
  }
}

// Usage in API routes:
const middleware = JobProcessingMiddleware.getInstance();
```
**Why**: Ensures single instance throughout app lifecycle, controls initialization order.

### 2. **Job Processing Pipeline** (lib/services/job-processing-middleware.ts)
Jobs flow through: **Normalization → Categorization → Ranking → De-duplication**
- Database jobs, external APIs (LinkedIn, Indeed), and sample data are merged
- Each source is processed independently, then combined and deduplicated
- Results are ranked by relevance weights
- Pipeline is async and handles errors gracefully

### 3. **Multi-Role Authentication** (lib/nextauth-config.ts)
- **Providers**: Google OAuth, GitHub OAuth, Email/Password (Credentials)
- **Session Strategy**: JWT with database sync
- **Critical**: Role selection happens at `/roles/choose` after first login
- User role (JOBSEEKER, EMPLOYER, ADMIN) stored in database, not session
- Environment variables must differentiate dev vs production cookie names

### 4. **Request Middleware** (middleware.ts)
- URL normalization: www → non-www redirection in production only
- Health check routes (`/api/health`) bypass security checks
- Localhost detection for development (no HTTPS enforcement)
- Uses X-Forwarded-Proto/Port headers from Nginx proxy

### 5. **Resume Parsing Pipeline** (lib/resume/\*)
- Accepts PDF/DOCX uploads via `/api/upload/resume`
- Parses with pdf-parse or mammoth
- AI extraction (OpenAI/Gemini) for experience, skills, education
- ATS optimization (Affinda integration optional)
- Auto-fills resume builder form fields

---

## Project Structure & Key Files

```
jobportal/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler - ⚠️ Update NEXTAUTH_URL if changing domain
│   │   ├── jobs/                  # Job CRUD and search endpoints
│   │   ├── applications/          # Application management
│   │   ├── upload/                # Resume/file uploads to GCS
│   │   └── health/                # Health check for deployment monitoring
│   ├── auth/                      # Authentication pages (signin, signup, error)
│   ├── dashboard/                 # Role-based dashboards (jobseeker, employer, admin)
│   ├── resume-builder/            # Multi-step resume builder with templates
│   └── jobs/                      # Job listing and detail pages
├── components/
│   ├── ui/                        # Radix UI + shadcn components (49 files)
│   ├── jobs/                      # Job search, filters, cards
│   ├── resume-builder/            # Form steps, ATS input, preview
│   └── auth/                      # OAuth buttons, auth flows
├── lib/
│   ├── services/                  # Singleton service classes
│   │   ├── job-processing-middleware.ts      # Main job pipeline
│   │   ├── job-normalization-service.ts      # Normalize job data across sources
│   │   ├── job-categorization-service.ts     # Category assignment
│   │   ├── job-ranking-service.ts            # Relevance ranking
│   │   └── monitoring-service.ts             # Observability
│   ├── jobs/                      # Job search utilities
│   │   ├── real-job-search.ts     # Combined database + external APIs
│   │   └── job-data-normalizer.ts # Data transformation
│   ├── resume/                    # Resume parsing and AI enhancement
│   ├── storage/                   # GCS and local file handling
│   ├── notifications/             # Email and socket.io notifications
│   ├── nextauth-config.ts         # Auth configuration - ⚠️ Critical
│   ├── prisma.ts                  # Singleton Prisma client
│   └── security-config.ts         # OAuth security (PKCE, etc.)
├── prisma/
│   └── schema.prisma              # Database schema (626 lines)
├── middleware.ts                  # Next.js request middleware
└── .github/workflows/
    └── deploy.yml                 # Production deployment (optimized, see workflow notes)
```

---

## Developer Workflows

### Local Development
```bash
# Start dev server (rebuilds on changes)
npm run dev

# Open http://localhost:3000
# Login with test credentials or Google OAuth (set GOOGLE_CLIENT_ID in .env.local)
```

### Building & Testing
```bash
# Generate Prisma client and build
npm run build

# Run build without linting (faster, for debugging)
npm run build:fast

# Run unit/integration tests
npm test
npm run test:watch

# Type checking
npm run type-check
```

### Database
```bash
# Apply migrations (required after schema changes)
npx prisma migrate dev

# View data in GUI
npx prisma studio

# Generate Prisma client (already in build, but manual if needed)
npx prisma generate

# Seed with sample data
npm run db:seed
```

### Deployment
```bash
# Production build (sets NODE_ENV=production, disables lint)
npm run build

# Manual PM2 start (server.cjs must exist)
pm2 start ecosystem.config.cjs --env production

# Check status
pm2 status
pm2 logs jobportal

# Restart after deployment
pm2 restart jobportal
```

---

## Code Style & Conventions

### API Routes
- Use **async/await** with try-catch for error handling
- Return JSON with `{ success: boolean, data?: T, error?: string }`
- Check auth with `getServerSession()` - ⚠️ Never trust client-side auth
- Validate input with Zod schema before processing

**Example** (app/api/jobs/route.ts):
```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });
    
    const body = await request.json();
    // Validate with Zod schema
    const parsed = JobSchema.parse(body);
    
    const job = await prisma.job.create({ data: parsed });
    return Response.json({ success: true, data: job });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

### React Components
- Use **functional components** with hooks
- Prefer **Server Components** for non-interactive content (default in App Router)
- Use **'use client'** directive only when needed (useState, events, hooks)
- Extract logic into custom hooks or service methods
- Apply **TypeScript strict mode** - all props must be typed

**Example** (components/JobCard.tsx):
```typescript
interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

export function JobCard({ job, onApply }: JobCardProps) {
  // No 'use client' needed if no interactivity
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{job.title}</h3>
      <p>{job.company}</p>
      {onApply && <button onClick={() => onApply(job.id)}>Apply</button>}
    </div>
  );
}
```

### Database & Prisma
- **Always use `prisma` singleton** from `@/lib/prisma`
- ⚠️ **Never create new PrismaClient()** in API routes - causes memory leaks
- Use **relations** instead of manual joins: `prisma.user.findUnique({ include: { jobs: true } })`
- Add **@@index** for frequently filtered fields (location, jobType, etc.)
- Use **@unique** constraints for email, usernames

---

## Environment Variables

### Critical for Runtime (must be set before deploy)
```bash
DATABASE_URL=postgresql://user:pass@localhost/jobportal
NEXTAUTH_SECRET=generate-with-openssl-rand-hex-32          # ⚠️ MUST be different in prod
NEXTAUTH_URL=https://naukrimili.com                        # Must match domain
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com            # From Google Cloud Console
GOOGLE_CLIENT_SECRET=xxx
GITHUB_ID=xxx                                              # Optional
GITHUB_SECRET=xxx
```

### Optional but Recommended
```bash
NEXT_PUBLIC_APP_URL=https://naukrimili.com                # Public-facing domain
GCS_BUCKET_NAME=naukrimili-resumes                         # Google Cloud Storage
OPENAI_API_KEY=sk-xxx                                      # Resume AI parsing
GOOGLE_GENERATIVE_AI_API_KEY=xxx                           # Alternative AI provider
```

### Build-Time Only (no runtime effect)
```bash
NEXT_TELEMETRY_DISABLED=1                                  # Disable Next.js telemetry
SKIP_ENV_VALIDATION=1                                      # Skip validation during build
```

---

## Common Patterns & Gotchas

### ⚠️ Authentication Gotchas
1. **Session is null in API routes** without `getServerSession(authOptions)` - always check before using
2. **Redirect after OAuth** goes to `/roles/choose` - user picks jobseeker/employer, this creates role in DB
3. **NextAuth_URL must be exact domain** - "https://naukrimili.com" not "https://naukrimili.com/"
4. **Cookies are secure in prod** - HTTP-only, same-site=lax, secure flag set

### ⚠️ Build & Deployment Gotchas
1. **Pre-build checks run during CI** - `npm run build` calls `npx prisma generate` first
2. **BUILD_ID is created at deploy time** - for cache busting, stored in `.next/BUILD_ID`
3. **Production build strips console.logs** - disable with `compiler: { removeConsole: false }` in next.config
4. **Prisma Client mismatch** - if versions differ between local and deployment, regenerate and commit lock file
5. **Environment variables at build time** - NODE_ENV=production must be set for optimized bundle

### ⚠️ Database Gotchas
1. **Relations are lazy-loaded** - use `include: { field: true }` to load related data
2. **Prisma generates types from schema** - schema changes require `npx prisma migrate dev` to regenerate types
3. **Indexes are critical for performance** - job search filters large dataset, ensure indexes match common queries
4. **Unique constraints**: `@@unique([source, sourceId])` prevents duplicate jobs from same API source

### ⚠️ Job Search Gotchas
1. **Three sources merge**: database + external APIs + sample data
2. **De-duplication happens after merge** - same job from multiple APIs removed by title+company match
3. **Ranking is by relevance weights** - salary range, location match, skills match
4. **External APIs may be slow** - timeout after 5-10s, still return database results

---

## Testing & Debugging

### Quick Debug Checklist
- [ ] Check `.env` file has all required variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- [ ] Verify Prisma client is generated: `ls lib/generated/` should exist
- [ ] Check database connection: `npx prisma studio` opens GUI
- [ ] Look for build errors: `npm run build` with full output, not --no-lint
- [ ] Auth issues: Check `pm2 logs jobportal` for NextAuth errors
- [ ] Job search empty: Verify database has jobs or external APIs are reachable

### Useful Commands
```bash
# Check build artifacts
ls -la .next/

# View live logs on server
pm2 logs jobportal --tail 100

# Kill and restart process
pm2 restart jobportal

# Database schema validation
npx prisma validate

# Find unused dependencies
npx depcheck

# Type errors only (fast)
npm run type-check
```

---

## Performance Considerations

### Job Search Optimization
- **Caching**: Use Redis for frequent queries (top companies, trending jobs)
- **Pagination**: Always limit results to 20-50 per page, use offset/cursor
- **Indexes**: Queries filter by country, location, jobType - ensure indexes exist
- **External APIs**: Call in parallel with Promise.all(), timeout after 5s

### Build Performance
- **Next.js builds** take 5-6 minutes in CI (optimized in recent changes)
- **npm install** takes 2-3 minutes with optimized .npmrc (legacy-peer-deps, maxsockets=100)
- **Deployment** takes ~15-20 minutes total (git pull + npm ci + build + PM2 start)

### Database Queries
- **N+1 queries**: Use `include: {}` to load relations in one query
- **Large result sets**: Use pagination, not `findMany()` without limit
- **Full-text search**: Typesense index for fast searching, fallback to database LIKE

---

## When You're Stuck

1. **Check existing docs**: Read CODEBASE_SCAN_REPORT.md, PROJECT_STRUCTURE.md (in root)
2. **Search codebase**: Look for similar patterns in app/api/ or lib/services/
3. **Check recent commits**: Git log shows recent fixes and patterns
4. **Test locally first**: `npm run dev`, reproduce issue before fixing
5. **Ask in comments**: Add detailed comments explaining "why" for future devs

---

## Deployment Notes

**Workflow**: `.github/workflows/deploy.yml` (recently optimized)
- Triggered on `git push origin main` or manual workflow_dispatch
- Deploys to Hostinger VPS via SSH (appleboy/ssh-action)
- Runs: git pull → npm ci (production deps only) → build → PM2 restart
- Health check: curl `http://localhost:3000/api/health`
- If deployment fails, logs are in GitHub Actions UI under "Deploy to Server" step

---

## Quick Links & Resources

- **Database Schema**: `prisma/schema.prisma` (626 lines, well-documented)
- **Auth Config**: `lib/nextauth-config.ts` (handles OAuth + Credentials providers)
- **Job Processing**: `lib/services/job-processing-middleware.ts` (main data flow)
- **API Routes**: `app/api/` (all endpoints documented with TypeScript)
- **Deployment**: `.github/workflows/deploy.yml` (CI/CD pipeline)

---

**Last Updated**: December 6, 2025 | **Version**: 1.0
