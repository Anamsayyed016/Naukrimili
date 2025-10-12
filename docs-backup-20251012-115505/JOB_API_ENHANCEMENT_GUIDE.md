# Job API Enhancement Guide

This guide explains how to use the enhanced job API system that stores jobs in your database and handles expired jobs gracefully.

## 🚀 Quick Start

### 1. Database Migration

Run the migration to add the `expiryDate` field:

```bash
# Generate Prisma client
npx prisma generate

# Apply migration
npx prisma db push
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Admin Sync Token (for manual job sync)
ADMIN_SYNC_TOKEN="your-secure-admin-token-here"

# External Job APIs (if not already configured)
ADZUNA_APP_ID="your-adzuna-app-id"
ADZUNA_APP_KEY="your-adzuna-app-key"
JSEARCH_API_KEY="your-jsearch-api-key"
GOOGLE_CSE_ID="your-google-cse-id"
GOOGLE_API_KEY="your-google-api-key"
JOOBLE_API_KEY="your-jooble-api-key"
```

### 3. Replace Job Details API

Replace your current job details API with the enhanced version:

```bash
# Backup current API
mv app/api/jobs/[id]/route.ts app/api/jobs/[id]/route.ts.backup

# Use enhanced version
mv app/api/jobs/[id]/enhanced-route.ts app/api/jobs/[id]/route.ts
```

## 📋 Features

### ✅ Database-First Job Storage
- All jobs are stored in PostgreSQL database
- External API calls are cached in database
- No more "Job Not Found" errors from API failures

### ✅ Expired Job Handling
- Jobs with `expiryDate` are marked as inactive
- Expired jobs show similar job suggestions
- Graceful fallback to external APIs if needed

### ✅ Daily Job Sync
- Automated daily job fetching from all sources
- Conflict resolution and change detection
- Statistics and monitoring

### ✅ Enhanced Job Details
- Better error handling
- Expired job UI with suggestions
- Consistent data structure

## 🔧 API Endpoints

### Job Details
```
GET /api/jobs/[id]
```
- Returns job from database first
- Handles expired jobs (410 status)
- Falls back to external APIs if needed

### Manual Job Sync
```
POST /api/jobs/sync
Authorization: Bearer YOUR_ADMIN_SYNC_TOKEN
```
- Triggers manual job sync
- Returns statistics

### Job Statistics
```
GET /api/jobs/sync
```
- Returns current job statistics
- Shows counts by source

## 🕐 Daily Sync Setup

### Option 1: Cron Job (Recommended)

Add to your server's crontab:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/your/project && curl -X POST -H "Authorization: Bearer YOUR_ADMIN_SYNC_TOKEN" https://yourdomain.com/api/jobs/sync
```

### Option 2: PM2 Cron

Create a PM2 cron job:

```bash
# Install PM2 cron
npm install -g pm2-cron

# Create cron job
pm2-cron "0 2 * * *" "curl -X POST -H 'Authorization: Bearer YOUR_ADMIN_SYNC_TOKEN' https://yourdomain.com/api/jobs/sync"
```

### Option 3: Manual Trigger

Trigger manually via API:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_SYNC_TOKEN" \
  https://yourdomain.com/api/jobs/sync
```

## 🎨 Frontend Integration

### Expired Job Handling

The system automatically handles expired jobs by:

1. **Detecting expired jobs** (expiryDate < now)
2. **Showing expired job UI** with similar suggestions
3. **Providing alternative jobs** from the database

### Job Details Pages

All job details pages now support:
- Expired job detection
- Similar job suggestions
- Better error handling
- Consistent data structure

## 📊 Monitoring

### Check Job Statistics

```bash
curl https://yourdomain.com/api/jobs/sync
```

Response:
```json
{
  "success": true,
  "stats": {
    "total": 1500,
    "active": 1200,
    "expired": 300,
    "bySource": {
      "adzuna": 500,
      "jsearch": 400,
      "google": 300,
      "manual": 200
    }
  }
}
```

### Monitor Sync Status

Check PM2 logs for sync status:

```bash
pm2 logs jobportal --lines 50
```

## 🔧 Configuration

### Customize Job Sync

Edit `lib/jobs/daily-scheduler.ts`:

```typescript
const customConfig: SchedulerConfig = {
  queries: ['software engineer', 'data scientist'],
  countries: ['IN', 'US'],
  maxJobsPerQuery: 25,
  enableAdzuna: true,
  enableJSearch: true,
  enableGoogleJobs: false,
  enableJooble: true
};

const scheduler = new DailyJobScheduler(customConfig);
```

### Test Sync

Test with a small batch:

```typescript
import { dailyScheduler } from '@/lib/jobs/daily-scheduler';

// Test with limited queries
const result = await dailyScheduler.testSync(
  ['software engineer'], 
  ['IN']
);
console.log(result);
```

## 🐛 Troubleshooting

### Common Issues

1. **Migration fails**
   ```bash
   # Reset database (development only)
   npx prisma db push --force-reset
   ```

2. **Sync fails**
   ```bash
   # Check API keys
   echo $ADZUNA_APP_ID
   echo $JSEARCH_API_KEY
   ```

3. **Jobs not showing**
   ```bash
   # Check database
   npx prisma studio
   ```

### Debug Mode

Enable debug logging:

```typescript
// In your API routes
console.log('🔍 Debug: Job data:', jobData);
```

## 📈 Performance

### Database Indexes

The system creates these indexes for optimal performance:

- `Job_expiryDate_idx` - For expired job queries
- `Job_isActive_expiryDate_idx` - For active job queries
- `Job_source_sourceId` - For unique job identification

### Caching

- External API responses are cached in database
- Similar job queries are optimized
- View counts are batched

## 🔒 Security

### Admin Token

Use a strong admin token:

```bash
# Generate secure token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limiting

Consider adding rate limiting to sync endpoint:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5 // 5 syncs per hour
});
```

## 📝 Migration Checklist

- [ ] Run database migration
- [ ] Add environment variables
- [ ] Replace job details API
- [ ] Test expired job handling
- [ ] Set up daily sync
- [ ] Monitor job statistics
- [ ] Update frontend components
- [ ] Test external job fallback

## 🎯 Benefits

1. **No more "Job Not Found" errors** - Jobs are stored in database
2. **Better user experience** - Expired jobs show alternatives
3. **Improved performance** - Database queries are faster than API calls
4. **Reliable data** - Jobs persist even if external APIs fail
5. **Better SEO** - Consistent job URLs and data
6. **Analytics** - Track job views, applications, and sources

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs jobportal`
2. Verify database connection: `npx prisma db push`
3. Test API endpoints: `curl https://yourdomain.com/api/jobs/sync`
4. Check environment variables: `echo $DATABASE_URL`

The system is designed to be robust and handle failures gracefully while providing a better user experience.
