# 🗄️ Database Setup Instructions for Job Portal

## 📋 Prerequisites

You need to install PostgreSQL on your Windows system to connect the job portal to a real database.

## 🚀 Installation Steps

### Step 1: Download PostgreSQL

1. **Visit the official PostgreSQL website**: https://www.postgresql.org/download/windows/
2. **Click "Download the installer"** for Windows
3. **Choose the latest version** (PostgreSQL 15 or 16 recommended)
4. **Download the installer** (approximately 300MB)

### Step 2: Install PostgreSQL

1. **Run the installer** as Administrator
2. **Choose installation directory** (default: `C:\Program Files\PostgreSQL\15`)
3. **Select components**:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (database management tool)
   - ✅ Stack Builder (optional)
   - ✅ Command Line Tools
4. **Set data directory** (default: `C:\Program Files\PostgreSQL\15\data`)
5. **Set password** for `postgres` user (remember this password!)
6. **Choose port** (default: 5432)
7. **Choose locale** (default: Default locale)
8. **Complete installation**

### Step 3: Verify Installation

1. **Open Command Prompt** as Administrator
2. **Test PostgreSQL**:
   ```cmd
   psql --version
   ```
3. **Start PostgreSQL service**:
   ```cmd
   net start postgresql-x64-15
   ```

### Step 4: Run Database Setup

After PostgreSQL is installed, run our setup script:

```cmd
.\setup-database-complete.bat
```

## 🔧 Alternative: Quick Setup with Docker

If you prefer using Docker:

### Step 1: Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

### Step 2: Run PostgreSQL with Docker
```cmd
docker run --name jobportal-postgres -e POSTGRES_PASSWORD=jobportal_password -e POSTGRES_DB=jobportal -p 5432:5432 -d postgres:15
```

### Step 3: Create Environment File
```cmd
echo DATABASE_URL="postgresql://postgres:jobportal_password@localhost:5432/jobportal?schema=public" > .env.local
```

### Step 4: Setup Database Schema
```cmd
npx prisma db push
npx prisma db seed
```

## 🎯 What the Setup Script Does

Our `setup-database-complete.bat` script will:

1. ✅ **Create database user** (`jobportal_user`)
2. ✅ **Create database** (`jobportal`)
3. ✅ **Set up permissions** and access
4. ✅ **Create environment file** (`.env.local`)
5. ✅ **Install dependencies** (`npm install`)
6. ✅ **Generate Prisma client** (`npx prisma generate`)
7. ✅ **Create database schema** (`npx prisma db push`)
8. ✅ **Seed with sample data** (companies, jobs, users)

## 📊 Sample Data Included

After setup, you'll have:

- **3 Companies**: TechCorp India, Digital Solutions Ltd, InnovateSoft
- **5 Jobs**: Senior Software Engineer, Frontend Developer, Data Analyst, DevOps Engineer, Product Manager
- **3 Users**: Admin, Employer, Job Seeker
- **Real database** with proper relationships

## 🔍 Verify Setup

After running the setup:

1. **Test API**: Visit `http://localhost:3000/api/jobs`
2. **View data**: Run `npx prisma studio`
3. **Check logs**: Look for successful database connections

## 🆘 Troubleshooting

### Common Issues:

1. **"PostgreSQL is not installed"**
   - Install PostgreSQL first (see Step 1-2 above)

2. **"Authentication failed"**
   - Check password in `.env.local`
   - Verify user permissions

3. **"Connection refused"**
   - Start PostgreSQL service: `net start postgresql-x64-15`
   - Check if port 5432 is available

4. **"Database does not exist"**
   - Run the setup script again
   - Check database creation in pgAdmin

### Manual Database Creation:

If the script fails, create manually:

```sql
-- Connect as postgres user
psql -U postgres

-- Create user and database
CREATE USER jobportal_user WITH PASSWORD 'jobportal_password';
CREATE DATABASE jobportal OWNER jobportal_user;
GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;

-- Exit
\q
```

## 🎉 Next Steps

After successful setup:

1. **Start the application**: `npm run dev`
2. **Test job search**: Visit `http://localhost:3000/jobs`
3. **Test job application**: Try applying for a job
4. **View admin panel**: Visit `http://localhost:3000/dashboard/admin`

## 📞 Support

If you encounter any issues:

1. Check the terminal output for error messages
2. Verify PostgreSQL is running: `pg_isready`
3. Check database connection: `psql -U jobportal_user -d jobportal`
4. Review the `.env.local` file for correct credentials

---

**Ready to proceed?** Install PostgreSQL and run `.\setup-database-complete.bat`!
