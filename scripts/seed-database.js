#!/usr/bin/env node

/**
 * DATABASE SEEDER SCRIPT
 * Populates the database with real job data and sample companies
 * Run this after setting up your database connection
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample companies data
const companies = [
  {
    id: 'company-1',
    name: 'TechCorp Solutions',
    description: 'Leading technology solutions provider specializing in AI and machine learning',
    logo: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=TC',
    website: 'https://techcorp-solutions.com',
    location: 'Bangalore, Karnataka',
    industry: 'Technology',
    size: '51-200',
    founded: 2018,
    isVerified: true
  },
  {
    id: 'company-2',
    name: 'FinTech Innovations',
    description: 'Revolutionary financial technology company transforming digital banking',
    logo: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=FI',
    website: 'https://fintech-innovations.com',
    location: 'Mumbai, Maharashtra',
    industry: 'Finance',
    size: '201-500',
    founded: 2016,
    isVerified: true
  },
  {
    id: 'company-3',
    name: 'HealthTech Systems',
    description: 'Advanced healthcare technology solutions for modern medical facilities',
    logo: 'https://via.placeholder.com/150x150/EF4444/FFFFFF?text=HS',
    website: 'https://healthtech-systems.com',
    location: 'Hyderabad, Telangana',
    industry: 'Healthcare',
    size: '51-200',
    founded: 2019,
    isVerified: true
  },
  {
    id: 'company-4',
    name: 'EduTech Pro',
    description: 'Innovative educational technology platform for modern learning',
    logo: 'https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=EP',
    website: 'https://edutech-pro.com',
    location: 'Delhi, NCR',
    industry: 'Education',
    size: '11-50',
    founded: 2020,
    isVerified: true
  },
  {
    id: 'company-5',
    name: 'Green Energy Corp',
    description: 'Sustainable energy solutions for a greener future',
    logo: 'https://via.placeholder.com/150x150/059669/FFFFFF?text=GE',
    website: 'https://green-energy-corp.com',
    location: 'Chennai, Tamil Nadu',
    industry: 'Energy',
    size: '201-500',
    founded: 2015,
    isVerified: true
  }
];

// Sample jobs data
const jobs = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp Solutions',
    companyId: 'company-1',
    location: 'Bangalore, Karnataka',
    country: 'IN',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.',
    applyUrl: 'https://techcorp-solutions.com/careers/senior-software-engineer',
    postedAt: new Date('2024-01-15'),
    salary: '₹15,00,000 - ₹25,00,000 per annum',
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'senior',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    isRemote: false,
    isHybrid: true,
    isUrgent: true,
    isFeatured: true,
    sector: 'Technology',
    views: 245,
    applicationsCount: 18
  },
  {
    title: 'Data Scientist',
    company: 'FinTech Innovations',
    companyId: 'company-2',
    location: 'Mumbai, Maharashtra',
    country: 'IN',
    description: 'Join our data science team to build cutting-edge machine learning models for financial risk assessment and fraud detection.',
    applyUrl: 'https://fintech-innovations.com/careers/data-scientist',
    postedAt: new Date('2024-01-20'),
    salary: '₹18,00,000 - ₹30,00,000 per annum',
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Finance',
    views: 189,
    applicationsCount: 12
  },
  {
    title: 'Frontend Developer',
    company: 'HealthTech Systems',
    companyId: 'company-3',
    location: 'Hyderabad, Telangana',
    country: 'IN',
    description: 'Create beautiful and responsive user interfaces for our healthcare applications. Experience with modern frontend frameworks required.',
    applyUrl: 'https://healthtech-systems.com/careers/frontend-developer',
    postedAt: new Date('2024-01-18'),
    salary: '₹8,00,000 - ₹15,00,000 per annum',
    salaryMin: 800000,
    salaryMax: 1500000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'entry',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js'],
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Healthcare',
    views: 156,
    applicationsCount: 8
  },
  {
    title: 'Product Manager',
    company: 'EduTech Pro',
    companyId: 'company-4',
    location: 'Delhi, NCR',
    country: 'IN',
    description: 'Lead product strategy and development for our educational technology platform. Experience in EdTech or SaaS products preferred.',
    applyUrl: 'https://edutech-pro.com/careers/product-manager',
    postedAt: new Date('2024-01-22'),
    salary: '₹20,00,000 - ₹35,00,000 per annum',
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'senior',
    skills: ['Product Management', 'Agile', 'User Research', 'Data Analysis', 'Strategy'],
    isRemote: true,
    isHybrid: true,
    isUrgent: true,
    isFeatured: true,
    sector: 'Education',
    views: 203,
    applicationsCount: 15
  },
  {
    title: 'DevOps Engineer',
    company: 'Green Energy Corp',
    companyId: 'company-5',
    location: 'Chennai, Tamil Nadu',
    country: 'IN',
    description: 'Build and maintain our cloud infrastructure and deployment pipelines. Experience with AWS, Docker, and Kubernetes required.',
    applyUrl: 'https://green-energy-corp.com/careers/devops-engineer',
    postedAt: new Date('2024-01-19'),
    salary: '₹12,00,000 - ₹22,00,000 per annum',
    salaryMin: 1200000,
    salaryMax: 2200000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Energy',
    views: 134,
    applicationsCount: 6
  },
  {
    title: 'UI/UX Designer',
    company: 'TechCorp Solutions',
    companyId: 'company-1',
    location: 'Bangalore, Karnataka',
    country: 'IN',
    description: 'Create intuitive and beautiful user experiences for our products. Strong portfolio and design thinking skills required.',
    applyUrl: 'https://techcorp-solutions.com/careers/ui-ux-designer',
    postedAt: new Date('2024-01-21'),
    salary: '₹10,00,000 - ₹18,00,000 per annum',
    salaryMin: 1000000,
    salaryMax: 1800000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems'],
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    views: 167,
    applicationsCount: 9
  },
  {
    title: 'Backend Developer',
    company: 'FinTech Innovations',
    companyId: 'company-2',
    location: 'Mumbai, Maharashtra',
    country: 'IN',
    description: 'Build scalable backend services and APIs for our financial applications. Experience with Java, Spring Boot, and microservices preferred.',
    applyUrl: 'https://fintech-innovations.com/careers/backend-developer',
    postedAt: new Date('2024-01-17'),
    salary: '₹14,00,000 - ₹24,00,000 per annum',
    salaryMin: 1400000,
    salaryMax: 2400000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Redis'],
    isRemote: false,
    isHybrid: true,
    isUrgent: true,
    isFeatured: false,
    sector: 'Finance',
    views: 198,
    applicationsCount: 11
  },
  {
    title: 'Marketing Manager',
    company: 'HealthTech Systems',
    companyId: 'company-3',
    location: 'Hyderabad, Telangana',
    country: 'IN',
    description: 'Lead our marketing initiatives and drive customer acquisition. Experience in B2B healthcare marketing preferred.',
    applyUrl: 'https://healthtech-systems.com/careers/marketing-manager',
    postedAt: new Date('2024-01-16'),
    salary: '₹16,00,000 - ₹28,00,000 per annum',
    salaryMin: 1600000,
    salaryMax: 2800000,
    salaryCurrency: 'INR',
    jobType: 'full-time',
    experienceLevel: 'senior',
    skills: ['Digital Marketing', 'Content Strategy', 'SEO', 'Analytics', 'B2B Marketing'],
    isRemote: true,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Healthcare',
    views: 145,
    applicationsCount: 7
  }
];

// Sample categories
const categories = [
  { name: 'Technology', description: 'Software development, IT services, and technology solutions' },
  { name: 'Finance', description: 'Banking, fintech, and financial services' },
  { name: 'Healthcare', description: 'Medical technology, pharmaceuticals, and healthcare services' },
  { name: 'Education', description: 'EdTech, training, and educational services' },
  { name: 'Energy', description: 'Renewable energy, utilities, and energy services' },
  { name: 'Marketing', description: 'Digital marketing, advertising, and brand management' },
  { name: 'Sales', description: 'Business development, account management, and sales operations' },
  { name: 'Design', description: 'UI/UX design, graphic design, and creative services' }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.jobBookmark.deleteMany();
    console.log('   ✅ Job bookmarks cleared');
    await prisma.application.deleteMany();
    console.log('   ✅ Applications cleared');
    await prisma.job.deleteMany();
    console.log('   ✅ Jobs cleared');
    await prisma.company.deleteMany();
    console.log('   ✅ Companies cleared');
    await prisma.category.deleteMany();
    console.log('   ✅ Categories cleared');

    // Seed companies
    console.log('🏢 Seeding companies...');
    for (const company of companies) {
      console.log(`   Creating company: ${company.name}`);
      const createdCompany = await prisma.company.create({
        data: company
      });
      console.log(`   ✅ Created company: ${createdCompany.id} - ${createdCompany.name}`);
    }

    // Seed categories
    console.log('📂 Seeding categories...');
    for (const category of categories) {
      console.log(`   Creating category: ${category.name}`);
      const createdCategory = await prisma.category.create({
        data: category
      });
      console.log(`   ✅ Created category: ${createdCategory.id} - ${createdCategory.name}`);
    }

    // Seed jobs
    console.log('💼 Seeding jobs...');
    for (const job of jobs) {
      console.log(`   Creating job: ${job.title} at ${job.company}`);
      const createdJob = await prisma.job.create({
        data: {
          ...job,
          rawJson: job, // Store the full job data as JSON
          source: 'manual',
          sourceId: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
      console.log(`   ✅ Created job: ${createdJob.id} - ${createdJob.title}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded ${companies.length} companies, ${categories.length} categories, and ${jobs.length} jobs`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
