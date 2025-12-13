
# Naukrimili Job Portal – AI Coding Agent Guide

## Project Overview
Naukrimili is a full-stack job portal (Next.js 15, Node.js, PostgreSQL, Prisma, NextAuth.js) with multi-role auth, AI resume parsing, and job search across internal DB and external APIs. See [CODEBASE_SCAN_REPORT.md](../CODEBASE_SCAN_REPORT.md) for a deep scan.

## Key Architecture & Patterns
- **Singleton Services**: All core logic in `lib/services/` uses `getInstance()` (see `job-processing-middleware.ts`). Never instantiate service classes directly in routes.
- **Job Pipeline**: Jobs flow through normalization, categorization, ranking, and deduplication. Data merges from DB, LinkedIn/Indeed, and sample sources, then deduped by title+company.
- **Multi-Role Auth**: Auth via Google, GitHub, or credentials. Role selection at `/roles/choose` after first login. Roles are DB-backed, not session-based. See `lib/nextauth-config.ts`.
- **Request Middleware**: `middleware.ts` handles www→non-www redirects, health check bypass, and Nginx proxy headers. Only enforce HTTPS in production.
- **Resume Parsing**: Uploads via `/api/upload/resume`, parsed with pdf-parse/mammoth, then AI extraction (OpenAI/Gemini). See `lib/resume/`.

## Developer Workflows
- **Dev server**: `npm run dev` (auto-rebuilds)
- **Build**: `npm run build` (calls `npx prisma generate` first)
- **Test**: `npm test` or `npm run test:watch`
- **Type check**: `npm run type-check`
- **DB Migrate**: `npx prisma migrate dev` (after schema changes)
- **Seed**: `npm run db:seed`
- **Deploy**: See `.github/workflows/deploy.yml` (CI/CD: git pull → npm ci → build → PM2 restart)
- **PM2**: `pm2 restart jobportal`, `pm2 logs jobportal`, `pm2 status`

## Conventions & Gotchas
- **API routes**: Always use `getServerSession()` for auth. Validate input with Zod. Return `{ success, data?, error? }`.
- **Prisma**: Use the singleton from `lib/prisma.ts`. Never instantiate PrismaClient in routes.
- **React**: Prefer server components. Use `'use client'` only when needed. All props must be typed.
- **Job search**: Always merge DB + external APIs, dedupe after merge, rank by weights. External API timeouts: 5–10s.
- **Env vars**: Critical: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Build**: NODE_ENV=production required for optimized bundle. Console logs stripped in prod unless disabled in `next.config`.
- **Deployment**: Health check at `/api/health`. Logs: `pm2 logs jobportal` or GitHub Actions UI.

## Key Files & Directories
- `app/api/` – All API endpoints (auth, jobs, applications, upload, health)
- `lib/services/` – Singleton business logic (job pipeline, monitoring, notifications)
- `lib/nextauth-config.ts` – Auth config (roles, providers)
- `prisma/schema.prisma` – DB schema (relations, indexes, constraints)
- `.github/workflows/deploy.yml` – CI/CD pipeline

## Troubleshooting
- Check `.env` for required vars
- `npx prisma studio` to inspect DB
- `npm run build` for build errors
- `pm2 logs jobportal` for runtime/auth issues
- If job search is empty, check DB and external API reachability

## When Stuck
- Read [CODEBASE_SCAN_REPORT.md](../CODEBASE_SCAN_REPORT.md) and [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)
- Search for patterns in `app/api/` and `lib/services/`
- Check recent git commits for fixes
- Add comments explaining "why" for non-obvious code

**Last Updated:** December 13, 2025
