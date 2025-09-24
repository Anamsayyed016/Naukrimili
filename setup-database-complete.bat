@echo off
REM Complete Database Setup Script for Job Portal (Windows)
REM This script sets up PostgreSQL database with proper configuration

echo 🚀 Setting up PostgreSQL Database for Job Portal...

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo 📥 Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed

REM Check if PostgreSQL service is running
pg_isready >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ PostgreSQL service is not running. Please start it manually.
    echo 💡 You can start it from Services or run: net start postgresql-x64-14
    pause
)

echo ✅ PostgreSQL service is running

REM Create database and user
echo 📊 Creating database and user...

REM Create user
psql -U postgres -c "CREATE USER jobportal_user WITH PASSWORD 'jobportal_password';" 2>nul || echo ⚠️ User might already exist

REM Create database
psql -U postgres -c "CREATE DATABASE jobportal OWNER jobportal_user;" 2>nul || echo ⚠️ Database might already exist

REM Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL ON SCHEMA public TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jobportal_user;"

echo ✅ Database and user created successfully

REM Create .env.local file
echo 📝 Creating environment configuration...

(
echo # Database Configuration
echo DATABASE_URL="postgresql://jobportal_user:jobportal_password@localhost:5432/jobportal?schema=public"
echo.
echo # NextAuth Configuration
echo NEXTAUTH_URL=http://localhost:3000
echo NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production
echo.
echo # Google OAuth ^(Optional - for Google login^)
echo GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
echo GOOGLE_CLIENT_SECRET=your-google-client-secret
echo.
echo # JWT Secret
echo JWT_SECRET=your-jwt-secret-key-here
echo.
echo # Production Settings
echo NODE_ENV=development
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
echo.
echo # Email ^(Optional^)
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=your-email@gmail.com
echo SMTP_PASS=your-app-password
echo.
echo # Google Search API ^(Optional - for enhanced search features^)
echo GOOGLE_SEARCH_API_KEY=your-google-search-api-key
echo GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
) > .env.local

echo ✅ Environment file created: .env.local

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

REM Run database migrations
echo 🗄️ Running database migrations...
call npx prisma db push

REM Create seed script
echo 🌱 Creating seed script...

(
echo const { PrismaClient } = require^('@prisma/client'^);
echo.
echo const prisma = new PrismaClient^(^);
echo.
echo async function main^(^) {
echo   console.log^('🌱 Starting database seed...'^);
echo.
echo   // Create sample companies
echo   const companies = await Promise.all^([
echo     prisma.company.create^({
echo       data: {
echo         name: 'TechCorp India',
echo         description: 'Leading technology company in India',
echo         industry: 'Technology',
echo         size: '1000-5000',
echo         location: 'Bangalore, India',
echo         website: 'https://techcorp.in',
echo         isVerified: true,
echo         isActive: true,
echo       }
echo     }^),
echo     prisma.company.create^({
echo       data: {
echo         name: 'Digital Solutions Ltd',
echo         description: 'Digital transformation company',
echo         industry: 'Technology',
echo         size: '100-500',
echo         location: 'Mumbai, India',
echo         website: 'https://digitalsolutions.com',
echo         isVerified: true,
echo         isActive: true,
echo       }
echo     }^),
echo     prisma.company.create^({
echo       data: {
echo         name: 'InnovateSoft',
echo         description: 'Software development company',
echo         industry: 'Technology',
echo         size: '50-100',
echo         location: 'Delhi, India',
echo         website: 'https://innovatesoft.com',
echo         isVerified: true,
echo         isActive: true,
echo       }
echo     }^)
echo   ]^);
echo.
echo   console.log^(`✅ Created ${companies.length} companies`^);
echo.
echo   // Create sample jobs
echo   const jobs = await Promise.all^([
echo     prisma.job.create^({
echo       data: {
echo         title: 'Senior Software Engineer',
echo         company: 'TechCorp India',
echo         location: 'Bangalore, India',
echo         country: 'IN',
echo         description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
echo         requirements: JSON.stringify^(['React', 'Node.js', 'TypeScript', 'PostgreSQL', '5+ years experience']^),
echo         skills: JSON.stringify^(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker']^),
echo         jobType: 'full-time',
echo         experienceLevel: 'senior',
echo         salary: '₹15,00,000 - ₹25,00,000',
echo         isRemote: false,
echo         isFeatured: true,
echo         isActive: true,
echo         source: 'manual',
echo         sourceId: 'sample-1',
echo         companyId: companies[0].id,
echo       }
echo     }^),
echo     prisma.job.create^({
echo       data: {
echo         title: 'Frontend Developer',
echo         company: 'Digital Solutions Ltd',
echo         location: 'Mumbai, India',
echo         country: 'IN',
echo         description: 'Join our frontend team to build beautiful and responsive user interfaces. Experience with modern JavaScript frameworks required.',
echo         requirements: JSON.stringify^(['JavaScript', 'React', 'CSS', 'HTML', '2+ years experience']^),
echo         skills: JSON.stringify^(['JavaScript', 'React', 'Vue.js', 'CSS3', 'HTML5', 'Webpack']^),
echo         jobType: 'full-time',
echo         experienceLevel: 'mid',
echo         salary: '₹8,00,000 - ₹15,00,000',
echo         isRemote: true,
echo         isFeatured: false,
echo         isActive: true,
echo         source: 'manual',
echo         sourceId: 'sample-2',
echo         companyId: companies[1].id,
echo       }
echo     }^),
echo     prisma.job.create^({
echo       data: {
echo         title: 'Data Analyst',
echo         company: 'InnovateSoft',
echo         location: 'Delhi, India',
echo         country: 'IN',
echo         description: 'We need a Data Analyst to help us make data-driven decisions. You will work with large datasets and create meaningful insights.',
echo         requirements: JSON.stringify^(['Python', 'SQL', 'Excel', 'Statistics', '2+ years experience']^),
echo         skills: JSON.stringify^(['Python', 'SQL', 'Pandas', 'NumPy', 'Matplotlib', 'Statistics']^),
echo         jobType: 'full-time',
echo         experienceLevel: 'mid',
echo         salary: '₹6,00,000 - ₹12,00,000',
echo         isRemote: false,
echo         isFeatured: false,
echo         isActive: true,
echo         source: 'manual',
echo         sourceId: 'sample-3',
echo         companyId: companies[2].id,
echo       }
echo     }^),
echo     prisma.job.create^({
echo       data: {
echo         title: 'DevOps Engineer',
echo         company: 'TechCorp India',
echo         location: 'Bangalore, India',
echo         country: 'IN',
echo         description: 'Manage our cloud infrastructure and deployment pipelines. Experience with AWS and containerization required.',
echo         requirements: JSON.stringify^(['AWS', 'Docker', 'Kubernetes', 'Linux', '3+ years experience']^),
echo         skills: JSON.stringify^(['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux']^),
echo         jobType: 'full-time',
echo         experienceLevel: 'senior',
echo         salary: '₹12,00,000 - ₹20,00,000',
echo         isRemote: true,
echo         isFeatured: true,
echo         isActive: true,
echo         source: 'manual',
echo         sourceId: 'sample-4',
echo         companyId: companies[0].id,
echo       }
echo     }^),
echo     prisma.job.create^({
echo       data: {
echo         title: 'Product Manager',
echo         company: 'Digital Solutions Ltd',
echo         location: 'Mumbai, India',
echo         country: 'IN',
echo         description: 'Lead product development and strategy. Work with cross-functional teams to deliver exceptional products.',
echo         requirements: JSON.stringify^(['Product Management', 'Agile', 'Analytics', 'Leadership', '4+ years experience']^),
echo         skills: JSON.stringify^(['Product Management', 'Agile', 'Analytics', 'Leadership', 'Communication', 'Strategy']^),
echo         jobType: 'full-time',
echo         experienceLevel: 'senior',
echo         salary: '₹18,00,000 - ₹30,00,000',
echo         isRemote: false,
echo         isFeatured: true,
echo         isActive: true,
echo         source: 'manual',
echo         sourceId: 'sample-5',
echo         companyId: companies[1].id,
echo       }
echo     }^)
echo   ]^);
echo.
echo   console.log^(`✅ Created ${jobs.length} jobs`^);
echo.
echo   // Create sample users
echo   const users = await Promise.all^([
echo     prisma.user.create^({
echo       data: {
echo         email: 'admin@jobportal.com',
echo         name: 'Admin User',
echo         role: 'admin',
echo         isActive: true,
echo         isVerified: true,
echo       }
echo     }^),
echo     prisma.user.create^({
echo       data: {
echo         email: 'employer@techcorp.com',
echo         name: 'TechCorp HR',
echo         role: 'employer',
echo         isActive: true,
echo         isVerified: true,
echo       }
echo     }^),
echo     prisma.user.create^({
echo       data: {
echo         email: 'jobseeker@example.com',
echo         name: 'John Doe',
echo         role: 'jobseeker',
echo         isActive: true,
echo         isVerified: true,
echo       }
echo     }^)
echo   ]^);
echo.
echo   console.log^(`✅ Created ${users.length} users`^);
echo.
echo   // Link companies to users
echo   await prisma.company.update^({
echo     where: { id: companies[0].id },
echo     data: { createdBy: users[1].id }
echo   }^);
echo.
echo   await prisma.company.update^({
echo     where: { id: companies[1].id },
echo     data: { createdBy: users[1].id }
echo   }^);
echo.
echo   await prisma.company.update^({
echo     where: { id: companies[2].id },
echo     data: { createdBy: users[1].id }
echo   }^);
echo.
echo   console.log^('✅ Linked companies to users'^);
echo.
echo   console.log^('🎉 Database seeding completed successfully!'^);
echo }
echo.
echo main^(^)
echo   .catch^((e^) =^> {
echo     console.error^('❌ Error during seeding:', e^);
echo     process.exit^(1^);
echo   }^)
echo   .finally^(async ^(^) =^> {
echo     await prisma.$disconnect^(^);
echo   }^);
) > prisma\seed.js

REM Run the seed script
echo 🌱 Seeding database with sample data...
call node prisma\seed.js

echo ✅ Database seeded with sample data

REM Test the database connection
echo 🧪 Testing database connection...
call npx prisma db pull

echo.
echo 🎉 Database setup completed successfully!
echo 📝 You can now run: npm run dev
echo 🗄️ Database URL: postgresql://jobportal_user:jobportal_password@localhost:5432/jobportal
echo 👀 You can view your data with: npx prisma studio
echo.
pause

