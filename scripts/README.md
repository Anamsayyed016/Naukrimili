# 📁 Scripts Directory

This directory contains helper scripts and utilities for the Job Portal application. All scripts are designed to be safe, well-documented, and environment-aware.

## 🚀 Quick Start

```bash
# Setup environment
npx ts-node scripts/setup-env.ts

# Run database migrations
npx ts-node scripts/migrate-db.ts

# Seed test data
npx ts-node scripts/seed-data.ts

# Generate daily report
npx ts-node scripts/cron-jobs/daily-report.ts
```

## 📋 Available Scripts

### Core Scripts

#### `setup-env.ts`
Environment configuration and validation script.

**Features:**
- Loads environment variables from appropriate `.env` files
- Supports `.env.local`, `.env.staging`, `.env.production`
- Masks sensitive variables for safe logging
- Validates required environment variables
- Auto-detects environment from `NODE_ENV`

**Usage:**
```bash
# Load environment for current NODE_ENV
npx ts-node scripts/setup-env.ts

# Load specific environment
NODE_ENV=production npx ts-node scripts/setup-env.ts
```

**Output:**
- Environment summary with masked sensitive data
- Validation results for required variables
- Configuration details for debugging

---

#### `migrate-db.ts`
Database migration and schema management script.

**Features:**
- Runs Prisma migrations based on environment
- Auto-detects environment (local/vps/git/production)
- Fails safely on production unless explicitly confirmed
- Supports schema reset and rollback
- Validates database connection before migration

**Usage:**
```bash
# Run migrations (safe for all environments)
npx ts-node scripts/migrate-db.ts

# Force production migration (use with caution)
npx ts-node scripts/migrate-db.ts --force-production

# Reset database (development only)
npx ts-node scripts/migrate-db.ts --reset

# Rollback last migration (development only)
npx ts-node scripts/migrate-db.ts --rollback
```

**Safety Features:**
- Production migrations require `--force-production` flag
- Database connection validation
- Migration status reporting
- Rollback protection for production

---

#### `seed-data.ts`
Database seeding script for test and demo data.

**Features:**
- Inserts test/demo data in local/staging environments
- Never affects production unless safe flag is passed
- Supports different data types: users, jobs, companies, categories
- Configurable data counts and types
- Safe data generation with realistic content

**Usage:**
```bash
# Seed all data types (10 records each)
npx ts-node scripts/seed-data.ts

# Seed specific data type
npx ts-node scripts/seed-data.ts --type=users --count=50

# Seed jobs only
npx ts-node scripts/seed-data.ts --type=jobs --count=100

# Clear existing data before seeding
npx ts-node scripts/seed-data.ts --clear

# Production-safe seeding (requires explicit flag)
npx ts-node scripts/seed-data.ts --production-safe
```

**Data Types:**
- `users` - Job seekers, employers, and admins
- `companies` - Company profiles and information
- `jobs` - Job postings with realistic data
- `categories` - Job categories and descriptions
- `all` - All data types (default)

**Safety Features:**
- Production seeding requires `--production-safe` flag
- Cannot clear data in production
- Realistic data generation
- Duplicate prevention

---

### Cron Jobs

#### `cron-jobs/daily-report.ts`
Daily report generation with platform statistics.

**Features:**
- Generates comprehensive daily reports
- Tracks jobs, users, companies, and applications
- Provides system health monitoring
- Saves reports to JSON files
- Identifies top companies, job titles, and locations

**Usage:**
```bash
# Generate today's report
npx ts-node scripts/cron-jobs/daily-report.ts

# Add to crontab for daily execution
# 0 9 * * * cd /path/to/project && npx ts-node scripts/cron-jobs/daily-report.ts
```

**Report Contents:**
- Key metrics (total jobs, users, companies, applications)
- Daily activity (new jobs, users, applications)
- Top companies by job count and applications
- Popular job titles and locations
- System health status

---

#### `cron-jobs/clean-old-logs.ts`
Log cleanup and database maintenance script.

**Features:**
- Cleans up expired logs and temporary data
- Configurable retention periods for different data types
- Database maintenance (VACUUM, ANALYZE)
- Temporary file cleanup
- Dry-run mode for testing

**Usage:**
```bash
# Run cleanup
npx ts-node scripts/cron-jobs/clean-old-logs.ts

# Dry run (see what would be deleted)
npx ts-node scripts/cron-jobs/clean-old-logs.ts --dry-run

# Add to crontab for daily execution
# 0 2 * * * cd /path/to/project && npx ts-node scripts/cron-jobs/clean-old-logs.ts
```

**Retention Periods:**
- Mobile Errors: 30 days
- Search History: 90 days
- Notifications: 30 days (read only)
- Sessions: 7 days
- OTP Verifications: 1 day
- Analytics Events: 365 days

---

## 🔧 Environment Detection

All scripts automatically detect the environment from `NODE_ENV`:

- **`development`** - Local development environment
- **`staging`** - Staging/testing environment
- **`production`** - Production environment
- **`test`** - Testing environment

## 🛡️ Safety Features

### Production Protection
- Production operations require explicit flags
- Database migrations need `--force-production`
- Data seeding needs `--production-safe`
- Rollback operations are disabled in production

### Environment Validation
- Required environment variables are validated
- Database connections are tested before operations
- Configuration is verified before execution

### Data Safety
- Sensitive data is masked in logs
- Backup recommendations for destructive operations
- Dry-run modes for testing changes

## 📦 Package.json Scripts

Add these to your `package.json` for convenience:

```json
{
  "scripts": {
    "env:setup": "npx ts-node scripts/setup-env.ts",
    "db:migrate": "npx ts-node scripts/migrate-db.ts",
    "db:migrate:force": "npx ts-node scripts/migrate-db.ts --force-production",
    "db:seed": "npx ts-node scripts/seed-data.ts",
    "db:seed:users": "npx ts-node scripts/seed-data.ts --type=users --count=50",
    "db:seed:jobs": "npx ts-node scripts/seed-data.ts --type=jobs --count=100",
    "report:daily": "npx ts-node scripts/cron-jobs/daily-report.ts",
    "cleanup:logs": "npx ts-node scripts/cron-jobs/clean-old-logs.ts",
    "cleanup:logs:dry": "npx ts-node scripts/cron-jobs/clean-old-logs.ts --dry-run"
  }
}
```

## 🚨 Important Notes

### Never Run These on Production
- `seed-data.ts` without `--production-safe`
- `migrate-db.ts --reset`
- `migrate-db.ts --rollback`

### Always Test First
- Use `--dry-run` flags when available
- Test scripts in staging environment first
- Verify environment variables before running

### Backup Before Major Operations
- Database migrations can be destructive
- Always backup production data before migrations
- Test rollback procedures in staging

## 🔍 Troubleshooting

### Common Issues

**Environment Variables Not Loading:**
```bash
# Check if .env file exists
ls -la .env*

# Verify NODE_ENV is set
echo $NODE_ENV

# Run setup-env to debug
npx ts-node scripts/setup-env.ts
```

**Database Connection Issues:**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test database connection
npx prisma db pull --print

# Run migration with verbose output
npx ts-node scripts/migrate-db.ts
```

**Permission Issues:**
```bash
# Make scripts executable
chmod +x scripts/*.ts

# Run with proper permissions
sudo npx ts-node scripts/migrate-db.ts
```

### Getting Help

1. Check the script output for error messages
2. Verify environment variables are set correctly
3. Ensure database is accessible and running
4. Check file permissions and paths
5. Review the script documentation above

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Cron Job Setup Guide](https://crontab.guru/)
- [Database Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Maintainer:** Job Portal Development Team
