# Render Deployment Reference

## Service Type
Web Service (Node 18+)

## Build Command
```
pnpm install --frozen-lockfile && pnpm build
```

If using Prisma migrations:
```
pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build
```

## Start Command
```
pnpm start
```

## Environment Variables (example)
```
NODE_ENV=production
NEXTAUTH_SECRET=replace-with-strong-secret
NEXTAUTH_URL=https://your-app.onrender.com
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=replace-with-jwt-secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```
Add any feature-specific vars.

## Health Check
Set to /api/health

## Static Asset Caching
Enable CDN; purge if UI not updating.

## Scaling
Start with Starter instance. Upgrade CPU/RAM for heavier job ingestion or resume parsing.

## Logs & Monitoring
Use Render dashboard logs. Add external uptime monitor.

## Zero Downtime
Push to main; Render builds new image then swaps.

## Debug Tips
1. Build failing? Check Node version and lockfile.
2. Prisma errors? Ensure DATABASE_URL present during build.
3. 500s only in prod? Run locally with production build commands.

## Next Steps
- Add a worker service if you introduce queues or scheduled tasks.
- Add cron job for periodic cleanup or analytics aggregation.
