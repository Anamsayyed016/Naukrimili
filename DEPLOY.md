# 🚀 Deployment Guide (Render)

This project is now configured for a Node server build (API routes + dynamic features). Below are steps to deploy on Render (https://render.com) and remove any dependency on Vercel.

## 1. Repository Prep
```bash
git add .
git commit -m "Prepare Render deployment"
git push origin main
```

## 2. Create a Render Web Service
1. Log in to Render → New → Web Service
2. Connect your GitHub repo
3. Select Branch: `main`
4. Runtime: Node 18+
5. Build Command:
```bash
pnpm install --frozen-lockfile && pnpm build
```
6. Start Command:
```bash
pnpm start
```
7. Instance Type: Start with Starter; upgrade if needed

## 3. Required Environment Variables
Set these in Render → Environment (all are examples, adjust to your needs):
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=replace-with-strong-secret
NEXTAUTH_URL=https://your-render-domain.onrender.com
JWT_SECRET=replace-with-jwt-secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```
Add any additional variables your Prisma schema or features require.

## 4. Prisma Considerations
Render ephemeral build containers run the build before the service starts:
```bash
pnpm prisma generate
```
Already handled via `postinstall` in package.json. For migrations:
```bash
pnpm prisma migrate deploy
```
Add that to the build command if you use migrations.

## 5. Caching & Performance
- Enable CDN for static assets (Render Dashboard → Settings → Static Cache)
- Consider adding `CACHE_BUSTER` env var if aggressive caching issues appear

## 6. Health Check
Set Health Check Path: `/api/health`

## 7. Logs & Monitoring
- Use Render Logs tab for runtime errors
- Add an external uptime monitor (e.g. UptimeRobot)

## 8. Zero‑Downtime Updates
Push to `main`; Render rebuilds and swaps

## 9. Optional: Background Workers
If you later need cron or queues, create a separate Render Cron Job or Worker service pointing at a script (e.g. `node scripts/digest.js`).

## 10. Local Production Simulation
```bash
pnpm install
pnpm build
pnpm start
```

## Working API Examples After Deployment
```
GET  /api/jobs/real
POST /api/resumes/upload
GET  /api/companies
GET  /api/health
```

## ✅ Ready
Your job portal is deployable on Render with full server features.