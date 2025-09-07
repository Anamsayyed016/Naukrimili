# 🚀 Server Commands for Job Portal

## 📋 **Database Setup Commands**

### 1. **Configure Database Environment**
```bash
# Create .env.local file with PostgreSQL connection
echo 'DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"' > .env.local
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env.local
echo 'NEXTAUTH_SECRET="your-super-secret-key-here-min-32-characters"' >> .env.local
```

### 2. **Initialize Database**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
node scripts/test-jobs-api.js
```

### 3. **Database Management**
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Check database status
npx prisma db status
```

## 🔧 **Development Server Commands**

### 1. **Start Development Server**
```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Or with PM2 (recommended for production-like environment)
pm2 start npm --name "jobportal" -- run dev
```

### 2. **Build and Production**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or with PM2
pm2 start npm --name "jobportal-prod" -- run start
```

## 🧪 **Testing Commands**

### 1. **Test Jobs API**
```bash
# Test database connection and add sample jobs
node scripts/test-jobs-api.js

# Test API endpoints
curl "http://localhost:3000/api/jobs"
curl "http://localhost:3000/api/jobs?query=developer"
curl "http://localhost:3000/api/jobs?location=Bangalore"
```

### 2. **Test Specific Endpoints**
```bash
# Test health check
curl "http://localhost:3000/api/health"

# Test jobs with filters
curl "http://localhost:3000/api/jobs?query=software&location=Mumbai&jobType=full-time"

# Test advanced jobs API
curl "http://localhost:3000/api/jobs/enhanced?query=developer&country=IN"
```

## 📊 **Database Query Commands**

### 1. **Direct Database Queries**
```bash
# Connect to PostgreSQL directly
psql -h localhost -U username -d jobportal

# Or using Prisma CLI
npx prisma db execute --stdin
```

### 2. **Useful SQL Queries**
```sql
-- Check total jobs
SELECT COUNT(*) FROM "Job";

-- Check active jobs
SELECT COUNT(*) FROM "Job" WHERE "isActive" = true;

-- Check jobs by location
SELECT location, COUNT(*) FROM "Job" WHERE "isActive" = true GROUP BY location;

-- Check jobs by company
SELECT company, COUNT(*) FROM "Job" WHERE "isActive" = true GROUP BY company;

-- Search jobs by title
SELECT title, company, location FROM "Job" WHERE title ILIKE '%developer%' AND "isActive" = true;

-- Check recent jobs
SELECT title, company, "createdAt" FROM "Job" WHERE "isActive" = true ORDER BY "createdAt" DESC LIMIT 10;
```

## 🔍 **Debugging Commands**

### 1. **Check Application Status**
```bash
# Check if server is running
curl -I http://localhost:3000

# Check API health
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/debug/database
```

### 2. **View Logs**
```bash
# View PM2 logs
pm2 logs jobportal

# View specific log
pm2 logs jobportal --lines 100

# Monitor in real-time
pm2 monit
```

### 3. **Restart Services**
```bash
# Restart PM2 process
pm2 restart jobportal

# Restart with environment update
pm2 restart jobportal --update-env

# Stop and start
pm2 stop jobportal
pm2 start jobportal
```

## 🚀 **Production Deployment Commands**

### 1. **Build and Deploy**
```bash
# Build application
npm run build

# Start production server
pm2 start npm --name "jobportal-prod" -- run start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 2. **Database Migration (Production)**
```bash
# Run migrations
npx prisma migrate deploy

# Or push schema changes
npx prisma db push --accept-data-loss
```

## 📈 **Monitoring Commands**

### 1. **Check Performance**
```bash
# Check PM2 status
pm2 status

# Check memory usage
pm2 show jobportal

# Check logs for errors
pm2 logs jobportal --err
```

### 2. **Database Monitoring**
```bash
# Check database size
npx prisma db execute --stdin <<< "SELECT pg_size_pretty(pg_database_size('jobportal'));"

# Check table sizes
npx prisma db execute --stdin <<< "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 🛠️ **Troubleshooting Commands**

### 1. **Common Issues**
```bash
# Clear PM2 logs
pm2 flush

# Restart all PM2 processes
pm2 restart all

# Check for port conflicts
netstat -tulpn | grep :3000

# Check disk space
df -h
```

### 2. **Reset Everything**
```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Reset database
npx prisma db push --force-reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart everything
npm run dev
```

## 📝 **Quick Fix Commands**

### 1. **Jobs Not Showing - Quick Fix**
```bash
# 1. Check database connection
node scripts/test-jobs-api.js

# 2. If no jobs, add sample data
node scripts/test-jobs-api.js

# 3. Restart server
pm2 restart jobportal

# 4. Test API
curl "http://localhost:3000/api/jobs"
```

### 2. **Database Connection Issues**
```bash
# 1. Check environment variables
cat .env.local

# 2. Test database connection
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Restart application
pm2 restart jobportal
```

---

## 🎯 **Recommended Workflow**

1. **First Time Setup:**
   ```bash
   npm ci
   echo 'DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"' > .env.local
   npx prisma generate
   npx prisma db push
   node scripts/test-jobs-api.js
   npm run dev
   ```

2. **Daily Development:**
   ```bash
   pm2 start npm --name "jobportal" -- run dev
   pm2 logs jobportal
   ```

3. **Production Deployment:**
   ```bash
   npm run build
   pm2 start npm --name "jobportal-prod" -- run start
   pm2 save
   ```

4. **Monitoring:**
   ```bash
   pm2 status
   pm2 monit
   curl http://localhost:3000/api/health
   ```
