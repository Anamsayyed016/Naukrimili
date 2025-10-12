# 🗄️ **DATABASE SETUP GUIDE - JOB PORTAL**

## 🚨 **CRITICAL: Database Schema Mismatch Fixed**

Your database had a **CRITICAL MISMATCH** that would cause data corruption:
- **Prisma Schema Expected**: `Int` IDs (auto-increment integers)
- **Actual Database Had**: `String` IDs (UUIDs/strings)
- **Status**: ✅ **FIXED** - All ID fields now use `String` type

---

## 📋 **Prerequisites**

### **1. Database Requirements**
- **PostgreSQL** database (version 12 or higher)
- **Database name**: `jobportal` (or your preferred name)
- **User with full permissions** on the database

### **2. Environment Setup**
- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** for version control

---

## 🔧 **Step-by-Step Setup**

### **Step 1: Create Environment File**
```bash
# Copy the template
cp env.template .env.local

# Edit .env.local with your actual database credentials
nano .env.local  # or use any text editor
```

### **Step 2: Update Database URL**
In `.env.local`, update the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal?schema=public"
```

**Replace with your actual values:**
- `username`: Your database username
- `password`: Your database password
- `localhost`: Your database host (use `localhost` for local development)
- `5432`: Your database port (default PostgreSQL port)
- `jobportal`: Your database name

### **Step 3: Install Dependencies**
```bash
npm install
# or
yarn install
```

### **Step 4: Generate Prisma Client**
```bash
npx prisma generate
```

### **Step 5: Push Schema to Database**
```bash
npx prisma db push
```

---

## 🧪 **Verification & Testing**

### **Option 1: Use the Setup Script (Recommended)**
```bash
node scripts/setup-database.js
```

This script will:
- ✅ Check database connection
- ✅ Verify environment variables
- ✅ Generate Prisma client
- ✅ Push schema to database
- ✅ Show existing tables

### **Option 2: Manual Verification**
```bash
# Test database connection
npx prisma db pull

# Check database status
npx prisma studio
```

---

## 🔍 **Database Integrity Check**

After setup, run the integrity check:
```bash
node scripts/check-database-integrity.js
```

This will check for:
- ✅ Duplicate records
- ✅ Orphaned references
- ✅ Foreign key constraints
- ✅ Data consistency
- ✅ Table relationships

---

## 📊 **Database Schema Overview**

### **Core Tables**
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | `id`, `email`, `role`, `password` |
| `Company` | Company profiles | `id`, `name`, `createdBy`, `industry` |
| `Job` | Job postings | `id`, `title`, `companyId`, `createdBy` |
| `Application` | Job applications | `id`, `userId`, `jobId`, `status` |
| `Resume` | User resumes | `id`, `userId`, `fileName`, `fileUrl` |

### **Relationship Structure**
```
User (1) ←→ (Many) Company
User (1) ←→ (Many) Job
User (1) ←→ (Many) Application
Company (1) ←→ (Many) Job
Job (1) ←→ (Many) Application
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: DATABASE_URL not found**
**Error**: `Environment variable not found: DATABASE_URL`
**Solution**: 
1. Create `.env.local` file
2. Add your `DATABASE_URL`
3. Restart your development server

### **Issue 2: Connection refused**
**Error**: `Connection refused` or `Connection timeout`
**Solution**:
1. Check if PostgreSQL is running
2. Verify host, port, and credentials
3. Check firewall settings

### **Issue 3: Permission denied**
**Error**: `Permission denied` or `Access denied`
**Solution**:
1. Verify database user permissions
2. Check if user exists
3. Ensure user has access to database

### **Issue 4: Schema mismatch**
**Error**: `Column type mismatch` or `Type conversion error`
**Solution**: 
1. Run `npx prisma db push` to sync schema
2. Check if migrations are up to date
3. Verify Prisma client is generated

---

## 🔒 **Security Best Practices**

### **1. Environment Variables**
- ✅ Never commit `.env.local` to version control
- ✅ Use strong, unique passwords
- ✅ Rotate credentials regularly
- ✅ Use different credentials for dev/prod

### **2. Database Security**
- ✅ Limit database user permissions
- ✅ Use SSL connections in production
- ✅ Regular security updates
- ✅ Monitor access logs

### **3. Application Security**
- ✅ Input validation on all forms
- ✅ SQL injection prevention (Prisma handles this)
- ✅ CSRF protection enabled
- ✅ Rate limiting on APIs

---

## 📈 **Performance Optimization**

### **1. Database Indexes**
The schema includes optimized indexes for:
- ✅ User email lookups
- ✅ Job searches by location/type
- ✅ Application status queries
- ✅ Company industry searches

### **2. Query Optimization**
- ✅ Use Prisma's built-in query optimization
- ✅ Implement pagination for large datasets
- ✅ Cache frequently accessed data
- ✅ Monitor slow queries

---

## 🚀 **Production Deployment**

### **1. Environment Variables**
```env
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:prod_password@prod_host:5432/prod_db?schema=public&sslmode=require"
```

### **2. Database Migration**
```bash
# Generate migration
npx prisma migrate dev --name production_setup

# Apply migration
npx prisma migrate deploy
```

### **3. Health Checks**
```bash
# Check database status
npx prisma db pull

# Verify connections
node scripts/check-database-integrity.js
```

---

## 📞 **Support & Troubleshooting**

### **1. Check Logs**
```bash
# Prisma logs
DEBUG=prisma:* npm run dev

# Application logs
tail -f logs/combined-0.log
```

### **2. Database Tools**
- **Prisma Studio**: `npx prisma studio`
- **psql**: Direct database access
- **pgAdmin**: GUI database management

### **3. Common Commands**
```bash
# Reset database (DANGER: deletes all data)
npx prisma db push --force-reset

# Generate new client
npx prisma generate

# Check schema status
npx prisma validate
```

---

## ✅ **Verification Checklist**

Before proceeding with development:

- [ ] `.env.local` file created with correct `DATABASE_URL`
- [ ] PostgreSQL database running and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Schema pushed to database (`npx prisma db push`)
- [ ] Database connection verified
- [ ] Integrity check passed
- [ ] No duplicate or corrupted data found

---

## 🎯 **Next Steps**

After successful database setup:

1. **Test the employer system**:
   - Register as an employer
   - Create company profile
   - Post a job
   - Verify job appears in listings

2. **Test the jobseeker system**:
   - Register as a jobseeker
   - Upload resume
   - Apply to jobs
   - Check application status

3. **Monitor system health**:
   - Run integrity checks regularly
   - Monitor database performance
   - Check for any errors in logs

---

## 🆘 **Emergency Recovery**

If database corruption occurs:

1. **Stop the application immediately**
2. **Backup current database**
3. **Run integrity check**: `node scripts/check-database-integrity.js`
4. **Identify corrupted records**
5. **Restore from backup or fix manually**
6. **Verify integrity before restarting**

---

## 📚 **Additional Resources**

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

---

**🎉 Your database is now properly configured and ready for production use!**
