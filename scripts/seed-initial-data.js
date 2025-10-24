const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    location: 'Bangalore, Karnataka',
    country: 'IN',
    description: 'We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and PostgreSQL. The ideal candidate should have strong problem-solving skills and experience with microservices architecture.',
    jobType: 'full-time',
    experienceLevel: 'senior',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'AWS'],
    isRemote: false,
    isFeatured: true,
    isActive: true,
    sector: 'Technology',
    salary: '25-40 LPA',
    salaryMin: 2500000,
    salaryMax: 4000000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'Data Scientist',
    company: 'Analytics Pro',
    location: 'Mumbai, Maharashtra',
    country: 'IN',
    description: 'Join our data science team to build machine learning models and drive data-driven decisions. Experience with Python, TensorFlow, and big data technologies required.',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas', 'NumPy'],
    isRemote: true,
    isFeatured: true,
    isActive: true,
    sector: 'Technology',
    salary: '18-30 LPA',
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'Product Manager',
    company: 'InnovateTech',
    location: 'Delhi, NCR',
    country: 'IN',
    description: 'Lead product strategy and development for our SaaS platform. Experience with agile methodologies and user research required.',
    jobType: 'full-time',
    experienceLevel: 'senior',
    skills: ['Product Management', 'Agile', 'User Research', 'Analytics', 'SQL', 'Figma'],
    isRemote: false,
    isFeatured: false,
    isActive: true,
    sector: 'Technology',
    salary: '20-35 LPA',
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'UI/UX Designer',
    company: 'Design Studio',
    location: 'Hyderabad, Telangana',
    country: 'IN',
    description: 'Create beautiful and intuitive user experiences for web and mobile applications. Strong portfolio and design thinking skills required.',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['UI Design', 'UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
    isRemote: true,
    isFeatured: true,
    isActive: true,
    sector: 'Design',
    salary: '15-25 LPA',
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    location: 'Pune, Maharashtra',
    country: 'IN',
    description: 'Manage and optimize our cloud infrastructure. Experience with AWS, Docker, Kubernetes, and CI/CD pipelines required.',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
    isRemote: false,
    isFeatured: false,
    isActive: true,
    sector: 'Technology',
    salary: '18-32 LPA',
    salaryMin: 1800000,
    salaryMax: 3200000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  }
];

const sampleCompanies = [
  {
    name: 'TechCorp Solutions',
    description: 'Leading technology company specializing in enterprise software solutions',
    location: 'Bangalore, Karnataka',
    industry: 'Technology',
    size: '201-500',
    founded: 2015,
    isVerified: true
  },
  {
    name: 'Analytics Pro',
    description: 'Data analytics and business intelligence company',
    location: 'Mumbai, Maharashtra',
    industry: 'Technology',
    size: '51-200',
    founded: 2018,
    isVerified: true
  },
  {
    name: 'InnovateTech',
    description: 'Innovative technology startup focused on SaaS solutions',
    location: 'Delhi, NCR',
    industry: 'Technology',
    size: '11-50',
    founded: 2020,
    isVerified: false
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.jobBookmark.deleteMany();
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create sample companies
    console.log('🏢 Creating sample companies...');
    const companies = [];
    for (const companyData of sampleCompanies) {
      const company = await prisma.company.create({
        data: companyData
      });
      companies.push(company);
      console.log(`✅ Created company: ${company.name}`);
    }

    // Create sample jobs
    console.log('💼 Creating sample jobs...');
    for (let i = 0; i < sampleJobs.length; i++) {
      const jobData = sampleJobs[i];
      const company = companies[i % companies.length];
      
      const job = await prisma.job.create({
        data: {
          ...jobData,
          companyId: company.id,
          createdBy: null // No user created these jobs
        }
      });
      console.log(`✅ Created job: ${job.title} at ${company.name}`);
    }

    // Create a test user
    console.log('👤 Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'jobseeker',
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ Created test user: ${testUser.email}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${sampleCompanies.length} companies and ${sampleJobs.length} jobs`);
    console.log(`👤 Created test user: ${testUser.email}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedData()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
