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
  },
  {
    title: 'Marketing Manager',
    company: 'BrandBoost Inc',
    location: 'Chennai, Tamil Nadu',
    country: 'IN',
    description: 'Drive marketing campaigns and brand awareness for our growing startup. Experience with digital marketing, content strategy, and social media required.',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['Digital Marketing', 'Content Strategy', 'Social Media', 'SEO', 'Google Analytics', 'Email Marketing'],
    isRemote: false,
    isFeatured: true,
    isActive: true,
    sector: 'Marketing',
    salary: '12-22 LPA',
    salaryMin: 1200000,
    salaryMax: 2200000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'Financial Analyst',
    company: 'FinanceCore Ltd',
    location: 'Gurgaon, Haryana',
    country: 'IN',
    description: 'Analyze financial data and create reports to support business decisions. Strong analytical skills and knowledge of financial modeling required.',
    jobType: 'full-time',
    experienceLevel: 'entry',
    skills: ['Financial Analysis', 'Excel', 'PowerBI', 'Financial Modeling', 'SQL', 'Python'],
    isRemote: false,
    isFeatured: false,
    isActive: true,
    sector: 'Finance',
    salary: '8-15 LPA',
    salaryMin: 800000,
    salaryMax: 1500000,
    salaryCurrency: 'INR',
    rawJson: { source: 'manual', postedAt: new Date() }
  },
  {
    title: 'Content Writer',
    company: 'ContentCraft',
    location: 'Remote',
    country: 'IN',
    description: 'Create engaging content for websites, blogs, and social media. Experience with SEO writing and content marketing preferred.',
    jobType: 'full-time',
    experienceLevel: 'entry',
    skills: ['Content Writing', 'SEO', 'Content Marketing', 'WordPress', 'Social Media', 'Copywriting'],
    isRemote: true,
    isFeatured: false,
    isActive: true,
    sector: 'Marketing',
    salary: '6-12 LPA',
    salaryMin: 600000,
    salaryMax: 1200000,
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
    isVerified: true,
    website: 'https://techcorp.com'
  },
  {
    name: 'Analytics Pro',
    description: 'Data analytics and business intelligence company',
    location: 'Mumbai, Maharashtra',
    industry: 'Technology',
    size: '51-200',
    founded: 2018,
    isVerified: true,
    website: 'https://analyticspro.com'
  },
  {
    name: 'InnovateTech',
    description: 'Innovative technology startup focused on SaaS solutions',
    location: 'Delhi, NCR',
    industry: 'Technology',
    size: '11-50',
    founded: 2020,
    isVerified: false,
    website: 'https://innovatetech.com'
  },
  {
    name: 'Design Studio',
    description: 'Creative design agency specializing in user experience',
    location: 'Hyderabad, Telangana',
    industry: 'Design',
    size: '11-50',
    founded: 2019,
    isVerified: true,
    website: 'https://designstudio.com'
  },
  {
    name: 'CloudTech Solutions',
    description: 'Cloud infrastructure and DevOps consulting company',
    location: 'Pune, Maharashtra',
    industry: 'Technology',
    size: '51-200',
    founded: 2017,
    isVerified: true,
    website: 'https://cloudtech.com'
  },
  {
    name: 'BrandBoost Inc',
    description: 'Digital marketing and brand development agency',
    location: 'Chennai, Tamil Nadu',
    industry: 'Marketing',
    size: '11-50',
    founded: 2021,
    isVerified: false,
    website: 'https://brandboost.com'
  },
  {
    name: 'FinanceCore Ltd',
    description: 'Financial services and consulting firm',
    location: 'Gurgaon, Haryana',
    industry: 'Finance',
    size: '101-200',
    founded: 2012,
    isVerified: true,
    website: 'https://financecore.com'
  },
  {
    name: 'ContentCraft',
    description: 'Content creation and digital marketing agency',
    location: 'Remote',
    industry: 'Marketing',
    size: '1-10',
    founded: 2022,
    isVerified: false,
    website: 'https://contentcraft.com'
  }
];

const sampleCategories = [
  { name: 'Technology', description: 'Software development, IT, and tech-related jobs' },
  { name: 'Marketing', description: 'Digital marketing, content, and brand management' },
  { name: 'Design', description: 'UI/UX design, graphic design, and creative roles' },
  { name: 'Finance', description: 'Financial analysis, accounting, and banking' },
  { name: 'Sales', description: 'Business development and sales positions' },
  { name: 'Operations', description: 'Business operations and management roles' },
  { name: 'Human Resources', description: 'HR, recruitment, and people operations' },
  { name: 'Education', description: 'Teaching, training, and educational roles' }
];

const sampleStaticContent = [
  {
    key: 'terms',
    title: 'Terms of Service',
    content: `
<h1>Terms of Service</h1>
<p>Last updated: ${new Date().toLocaleDateString()}</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using this job portal, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Use License</h2>
<p>Permission is granted to temporarily access the materials on this job portal for personal, non-commercial transitory viewing only.</p>

<h2>3. User Accounts</h2>
<p>When you create an account with us, you must provide accurate, complete, and current information at all times.</p>

<h2>4. Privacy Policy</h2>
<p>Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.</p>

<h2>5. Contact Information</h2>
<p>Questions about the Terms of Service should be sent to us at support@jobportal.com</p>
    `,
    isActive: true
  },
  {
    key: 'privacy',
    title: 'Privacy Policy',
    content: `
<h1>Privacy Policy</h1>
<p>Last updated: ${new Date().toLocaleDateString()}</p>

<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, apply for jobs, or contact us.</p>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, process job applications, and communicate with you.</p>

<h2>Information Sharing</h2>
<p>We may share your information with employers when you apply for jobs, with your consent, or as required by law.</p>

<h2>Data Security</h2>
<p>We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.</p>

<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at privacy@jobportal.com</p>
    `,
    isActive: true
  },
  {
    key: 'about',
    title: 'About Us',
    content: `
<h1>About Job Portal</h1>

<h2>Our Mission</h2>
<p>We connect talented professionals with amazing opportunities, helping both job seekers and employers find their perfect match.</p>

<h2>What We Do</h2>
<p>Our platform provides a comprehensive job search experience with features like:</p>
<ul>
  <li>Advanced job search and filtering</li>
  <li>AI-powered resume analysis</li>
  <li>Company profiles and insights</li>
  <li>Application tracking</li>
  <li>Career resources and tips</li>
</ul>

<h2>Our Team</h2>
<p>We're a passionate team of developers, designers, and career experts dedicated to making job search easier and more effective.</p>

<h2>Contact Us</h2>
<p>Have questions or feedback? We'd love to hear from you at hello@jobportal.com</p>
    `,
    isActive: true
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // Clear existing data in correct order (due to foreign key constraints)
    console.log('🧹 Clearing existing data...');
    await prisma.jobBookmark.deleteMany();
    await prisma.application.deleteMany();
    await prisma.staticContent.deleteMany();
    await prisma.category.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.job.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create categories
    console.log('📂 Creating job categories...');
    for (const categoryData of sampleCategories) {
      const category = await prisma.category.create({
        data: categoryData
      });
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create static content
    console.log('📄 Creating static content...');
    for (const contentData of sampleStaticContent) {
      const content = await prisma.staticContent.create({
        data: contentData
      });
      console.log(`✅ Created static content: ${content.key}`);
    }

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
      const company = companies.find(c => c.name === jobData.company) || companies[0];
      
      const job = await prisma.job.create({
        data: {
          ...jobData,
          companyId: company.id,
          createdBy: null // No user created these jobs initially
        }
      });
      console.log(`✅ Created job: ${job.title} at ${company.name}`);
    }

    // Create test users
    console.log('👤 Creating test users...');
    
    // Job seeker
    const jobSeeker = await prisma.user.create({
      data: {
        email: 'jobseeker@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        role: 'jobseeker',
        phone: '+91-9876543210',
        location: 'Bangalore, Karnataka',
        bio: 'Experienced software developer looking for new opportunities in full-stack development.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ Created job seeker: ${jobSeeker.email}`);

    // Employer
    const employer = await prisma.user.create({
      data: {
        email: 'employer@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'employer',
        phone: '+91-9876543211',
        location: 'Mumbai, Maharashtra',
        bio: 'HR Manager at TechCorp Solutions, passionate about finding great talent.',
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ Created employer: ${employer.email}`);

    // Admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+91-9876543212',
        location: 'Delhi, NCR',
        bio: 'System administrator for the job portal platform.',
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ Created admin: ${admin.email}`);

    // Create some bookmarks for the job seeker
    console.log('🔖 Creating sample bookmarks...');
    const jobs = await prisma.job.findMany({ take: 3 });
    for (const job of jobs) {
      await prisma.jobBookmark.create({
        data: {
          userId: jobSeeker.id,
          jobId: job.id,
          notes: `Interested in this ${job.title} position`
        }
      });
    }
    console.log(`✅ Created ${jobs.length} bookmarks for job seeker`);

    // Create some sample applications
    console.log('📝 Creating sample applications...');
    const firstTwoJobs = jobs.slice(0, 2);
    for (const job of firstTwoJobs) {
      await prisma.application.create({
        data: {
          userId: jobSeeker.id,
          jobId: job.id,
          companyId: job.companyId || companies[0].id,
          status: 'submitted',
          coverLetter: `I am very interested in the ${job.title} position and believe my skills align well with your requirements.`,
          appliedAt: new Date()
        }
      });

      // Update job application count
      await prisma.job.update({
        where: { id: job.id },
        data: { applicationsCount: { increment: 1 } }
      });
    }
    console.log(`✅ Created ${firstTwoJobs.length} applications`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${sampleCategories.length} categories created`);
    console.log(`   - ${sampleStaticContent.length} static content pages created`);
    console.log(`   - ${sampleCompanies.length} companies created`);
    console.log(`   - ${sampleJobs.length} jobs created`);
    console.log(`   - 3 test users created (jobseeker, employer, admin)`);
    console.log(`   - ${jobs.length} bookmarks created`);
    console.log(`   - ${firstTwoJobs.length} applications created`);
    console.log('\n🔑 Test Login Credentials:');
    console.log(`   Job Seeker: jobseeker@example.com`);
    console.log(`   Employer:   employer@example.com`);
    console.log(`   Admin:      admin@example.com`);
    console.log('\n✨ Your job portal is now ready with sample data!');
    
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
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });