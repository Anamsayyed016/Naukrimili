#!/bin/bash

# Complete Database Setup Script for Job Portal
# This script sets up PostgreSQL database with proper configuration

echo "🚀 Setting up PostgreSQL Database for Job Portal..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    print_status "For Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    print_status "For CentOS/RHEL: sudo yum install postgresql postgresql-server"
    print_status "For macOS: brew install postgresql"
    exit 1
fi

print_success "PostgreSQL is installed"

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    print_warning "PostgreSQL service is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 3
fi

print_success "PostgreSQL service is running"

# Create database and user
print_status "Creating database and user..."

# Create user
sudo -u postgres psql -c "CREATE USER jobportal_user WITH PASSWORD 'jobportal_password';" 2>/dev/null || print_warning "User might already exist"

# Create database
sudo -u postgres psql -c "CREATE DATABASE jobportal OWNER jobportal_user;" 2>/dev/null || print_warning "Database might already exist"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;"

# Grant schema privileges
sudo -u postgres psql -d jobportal -c "GRANT ALL ON SCHEMA public TO jobportal_user;"
sudo -u postgres psql -d jobportal -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jobportal_user;"
sudo -u postgres psql -d jobportal -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jobportal_user;"

print_success "Database and user created successfully"

# Create .env.local file
print_status "Creating environment configuration..."

cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://jobportal_user:jobportal_password@localhost:5432/jobportal?schema=public"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters-change-this-in-production

# Google OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Production Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google Search API (Optional - for enhanced search features)
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
EOF

print_success "Environment file created: .env.local"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma db push

# Seed the database with sample data
print_status "Seeding database with sample data..."

# Create a seed script
cat > prisma/seed.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp India',
        description: 'Leading technology company in India',
        industry: 'Technology',
        size: '1000-5000',
        location: 'Bangalore, India',
        website: 'https://techcorp.in',
        isVerified: true,
        isActive: true,
      }
    }),
    prisma.company.create({
      data: {
        name: 'Digital Solutions Ltd',
        description: 'Digital transformation company',
        industry: 'Technology',
        size: '100-500',
        location: 'Mumbai, India',
        website: 'https://digitalsolutions.com',
        isVerified: true,
        isActive: true,
      }
    }),
    prisma.company.create({
      data: {
        name: 'InnovateSoft',
        description: 'Software development company',
        industry: 'Technology',
        size: '50-100',
        location: 'Delhi, India',
        website: 'https://innovatesoft.com',
        isVerified: true,
        isActive: true,
      }
    })
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Software Engineer',
        company: 'TechCorp India',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
        requirements: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', '5+ years experience']),
        skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker']),
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹15,00,000 - ₹25,00,000',
        isRemote: false,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-1',
        companyId: companies[0].id,
      }
    }),
    prisma.job.create({
      data: {
        title: 'Frontend Developer',
        company: 'Digital Solutions Ltd',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Join our frontend team to build beautiful and responsive user interfaces. Experience with modern JavaScript frameworks required.',
        requirements: JSON.stringify(['JavaScript', 'React', 'CSS', 'HTML', '2+ years experience']),
        skills: JSON.stringify(['JavaScript', 'React', 'Vue.js', 'CSS3', 'HTML5', 'Webpack']),
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: '₹8,00,000 - ₹15,00,000',
        isRemote: true,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-2',
        companyId: companies[1].id,
      }
    }),
    prisma.job.create({
      data: {
        title: 'Data Analyst',
        company: 'InnovateSoft',
        location: 'Delhi, India',
        country: 'IN',
        description: 'We need a Data Analyst to help us make data-driven decisions. You will work with large datasets and create meaningful insights.',
        requirements: JSON.stringify(['Python', 'SQL', 'Excel', 'Statistics', '2+ years experience']),
        skills: JSON.stringify(['Python', 'SQL', 'Pandas', 'NumPy', 'Matplotlib', 'Statistics']),
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: '₹6,00,000 - ₹12,00,000',
        isRemote: false,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-3',
        companyId: companies[2].id,
      }
    }),
    prisma.job.create({
      data: {
        title: 'DevOps Engineer',
        company: 'TechCorp India',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Manage our cloud infrastructure and deployment pipelines. Experience with AWS and containerization required.',
        requirements: JSON.stringify(['AWS', 'Docker', 'Kubernetes', 'Linux', '3+ years experience']),
        skills: JSON.stringify(['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux']),
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹12,00,000 - ₹20,00,000',
        isRemote: true,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-4',
        companyId: companies[0].id,
      }
    }),
    prisma.job.create({
      data: {
        title: 'Product Manager',
        company: 'Digital Solutions Ltd',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Lead product development and strategy. Work with cross-functional teams to deliver exceptional products.',
        requirements: JSON.stringify(['Product Management', 'Agile', 'Analytics', 'Leadership', '4+ years experience']),
        skills: JSON.stringify(['Product Management', 'Agile', 'Analytics', 'Leadership', 'Communication', 'Strategy']),
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹18,00,000 - ₹30,00,000',
        isRemote: false,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-5',
        companyId: companies[1].id,
      }
    })
  ]);

  console.log(`✅ Created ${jobs.length} jobs`);

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@jobportal.com',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        isVerified: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'employer@techcorp.com',
        name: 'TechCorp HR',
        role: 'employer',
        isActive: true,
        isVerified: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'jobseeker@example.com',
        name: 'John Doe',
        role: 'jobseeker',
        isActive: true,
        isVerified: true,
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Link companies to users
  await prisma.company.update({
    where: { id: companies[0].id },
    data: { createdBy: users[1].id }
  });

  await prisma.company.update({
    where: { id: companies[1].id },
    data: { createdBy: users[1].id }
  });

  await prisma.company.update({
    where: { id: companies[2].id },
    data: { createdBy: users[1].id }
  });

  console.log('✅ Linked companies to users');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Run the seed script
node prisma/seed.js

print_success "Database seeded with sample data"

# Test the database connection
print_status "Testing database connection..."
npx prisma db pull

print_success "Database setup completed successfully!"
print_status "You can now run: npm run dev"
print_status "Database URL: postgresql://jobportal_user:jobportal_password@localhost:5432/jobportal"
print_status "You can view your data with: npx prisma studio"
