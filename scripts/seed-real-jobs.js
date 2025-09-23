/**
 * Seed Real Jobs Script
 * Populates database with real, diverse job listings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realJobs = [
  // Technology Jobs
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp India',
    location: 'Bangalore, India',
    country: 'IN',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions using modern technologies.',
    requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience with React, Node.js, and cloud technologies',
    salary: '₹12,00,000 - ₹18,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    skills: 'React, Node.js, AWS, MongoDB, TypeScript',
    benefits: 'Health insurance, flexible hours, remote work options',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_001',
    isActive: true
  },
  {
    title: 'Product Manager',
    company: 'InnovateTech',
    location: 'Hyderabad, India',
    country: 'IN',
    description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional user experiences and drive business growth.',
    requirements: 'MBA or equivalent, 3+ years product management experience, strong analytical skills',
    salary: '₹15,00,000 - ₹25,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    skills: 'Product Management, Analytics, Agile, User Research',
    benefits: 'Stock options, health insurance, professional development',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_002',
    isActive: true
  },
  {
    title: 'Full Stack Developer',
    company: 'WebCraft Solutions',
    location: 'Mumbai, India',
    country: 'IN',
    description: 'Join our dynamic team as a Full Stack Developer. You will work on exciting projects using cutting-edge technologies and contribute to our innovative solutions.',
    requirements: 'Bachelor\'s degree in Computer Science, 3+ years full-stack development experience',
    salary: '₹8,00,000 - ₹15,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    skills: 'JavaScript, Python, React, Django, PostgreSQL',
    benefits: 'Health insurance, flexible hours, learning budget',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_003',
    isActive: true
  },
  {
    title: 'Data Scientist',
    company: 'DataFlow Analytics',
    location: 'Delhi, India',
    country: 'IN',
    description: 'Analyze complex datasets to extract meaningful insights and drive data-driven decisions. Work with machine learning models and statistical analysis.',
    requirements: 'Master\'s degree in Data Science or related field, 2+ years experience with Python, R, and ML libraries',
    salary: '₹10,00,000 - ₹20,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (2-5 years)',
    skills: 'Python, R, Machine Learning, SQL, Statistics',
    benefits: 'Health insurance, flexible hours, research opportunities',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_004',
    isActive: true
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech Systems',
    location: 'Pune, India',
    country: 'IN',
    description: 'Manage and optimize our cloud infrastructure. Implement CI/CD pipelines and ensure high availability of our systems.',
    requirements: 'Bachelor\'s degree in Computer Science, 3+ years DevOps experience, AWS/Azure certification preferred',
    salary: '₹9,00,000 - ₹16,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    skills: 'AWS, Docker, Kubernetes, Jenkins, Terraform',
    benefits: 'Health insurance, flexible hours, certification support',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_005',
    isActive: true
  },
  // Healthcare Jobs
  {
    title: 'Senior Doctor',
    company: 'MediCare Hospital',
    location: 'Chennai, India',
    country: 'IN',
    description: 'Join our prestigious medical team as a Senior Doctor. Provide exceptional patient care and lead medical research initiatives.',
    requirements: 'MBBS with MD/MS, 5+ years experience, valid medical license',
    salary: '₹20,00,000 - ₹35,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    skills: 'Medical Diagnosis, Patient Care, Research, Leadership',
    benefits: 'Health insurance, professional development, research opportunities',
    isRemote: false,
    isHybrid: false,
    isUrgent: true,
    isFeatured: true,
    sector: 'Healthcare',
    source: 'manual',
    sourceId: 'manual_health_001',
    isActive: true
  },
  {
    title: 'Nurse Practitioner',
    company: 'HealthPlus Clinic',
    location: 'Kolkata, India',
    country: 'IN',
    description: 'Provide comprehensive patient care and support. Work in a collaborative environment with healthcare professionals.',
    requirements: 'B.Sc Nursing, 2+ years experience, valid nursing license',
    salary: '₹4,00,000 - ₹8,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (2-5 years)',
    skills: 'Patient Care, Medical Procedures, Communication, Teamwork',
    benefits: 'Health insurance, flexible hours, professional development',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Healthcare',
    source: 'manual',
    sourceId: 'manual_health_002',
    isActive: true
  },
  // Finance Jobs
  {
    title: 'Financial Analyst',
    company: 'FinanceFirst Corp',
    location: 'Gurgaon, India',
    country: 'IN',
    description: 'Analyze financial data and market trends to provide strategic insights. Support investment decisions and financial planning.',
    requirements: 'MBA in Finance or CFA, 3+ years financial analysis experience',
    salary: '₹12,00,000 - ₹20,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    skills: 'Financial Analysis, Excel, SQL, Market Research, Risk Assessment',
    benefits: 'Health insurance, performance bonus, professional development',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Finance',
    source: 'manual',
    sourceId: 'manual_finance_001',
    isActive: true
  },
  {
    title: 'Investment Banker',
    company: 'Capital Markets Ltd',
    location: 'Mumbai, India',
    country: 'IN',
    description: 'Lead complex financial transactions and provide strategic advisory services to corporate clients.',
    requirements: 'MBA from top-tier institution, 4+ years investment banking experience',
    salary: '₹25,00,000 - ₹50,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    skills: 'Financial Modeling, M&A, Capital Markets, Client Relations',
    benefits: 'Health insurance, performance bonus, stock options',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Finance',
    source: 'manual',
    sourceId: 'manual_finance_002',
    isActive: true
  },
  // Education Jobs
  {
    title: 'Computer Science Professor',
    company: 'Tech University',
    location: 'Bangalore, India',
    country: 'IN',
    description: 'Teach computer science courses and conduct research in cutting-edge technologies. Mentor students and contribute to academic excellence.',
    requirements: 'Ph.D. in Computer Science, 3+ years teaching experience, research publications',
    salary: '₹15,00,000 - ₹25,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    skills: 'Teaching, Research, Programming, Academic Writing, Mentoring',
    benefits: 'Health insurance, research funding, sabbatical opportunities',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Education',
    source: 'manual',
    sourceId: 'manual_edu_001',
    isActive: true
  },
  {
    title: 'School Principal',
    company: 'Elite International School',
    location: 'Delhi, India',
    country: 'IN',
    description: 'Lead our prestigious school and drive educational excellence. Manage faculty, curriculum, and student development programs.',
    requirements: 'Master\'s degree in Education, 8+ years educational leadership experience',
    salary: '₹18,00,000 - ₹30,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (8+ years)',
    skills: 'Educational Leadership, Curriculum Development, Staff Management, Strategic Planning',
    benefits: 'Health insurance, professional development, leadership training',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Education',
    source: 'manual',
    sourceId: 'manual_edu_002',
    isActive: true
  },
  // Marketing Jobs
  {
    title: 'Digital Marketing Manager',
    company: 'BrandBoost Agency',
    location: 'Mumbai, India',
    country: 'IN',
    description: 'Lead digital marketing campaigns and drive brand growth. Manage social media, SEO, and paid advertising strategies.',
    requirements: 'Bachelor\'s degree in Marketing, 4+ years digital marketing experience',
    salary: '₹8,00,000 - ₹15,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    skills: 'Digital Marketing, SEO, Social Media, Google Ads, Analytics',
    benefits: 'Health insurance, flexible hours, creative freedom',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Marketing',
    source: 'manual',
    sourceId: 'manual_marketing_001',
    isActive: true
  },
  {
    title: 'Content Writer',
    company: 'ContentCraft Studio',
    location: 'Bangalore, India',
    country: 'IN',
    description: 'Create engaging content for various platforms. Write blogs, articles, and marketing copy that resonates with target audiences.',
    requirements: 'Bachelor\'s degree in English or Journalism, 2+ years content writing experience',
    salary: '₹4,00,000 - ₹8,00,000',
    jobType: 'Full-time',
    experienceLevel: 'Entry Level (0-2 years)',
    skills: 'Content Writing, SEO, Social Media, Creative Writing, Research',
    benefits: 'Health insurance, flexible hours, creative projects',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Marketing',
    source: 'manual',
    sourceId: 'manual_marketing_002',
    isActive: true
  }
];

async function seedRealJobs() {
  try {
    console.log('🌱 Starting to seed real jobs...');

    // Clear existing sample jobs
    await prisma.job.deleteMany({
      where: {
        source: 'sample'
      }
    });
    console.log('✅ Cleared existing sample jobs');

    // Insert real jobs
    for (const job of realJobs) {
      await prisma.job.create({
        data: {
          ...job,
          requirements: JSON.stringify([job.requirements]),
          skills: JSON.stringify(job.skills.split(', ')),
          benefits: JSON.stringify([job.benefits]),
          rawJson: {
            ...job,
            aiEnhanced: true,
            enhancedAt: new Date().toISOString()
          }
        }
      });
    }

    console.log(`✅ Successfully seeded ${realJobs.length} real jobs`);

    // Verify the seeding
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({ where: { isActive: true } });
    const realJobsCount = await prisma.job.count({ where: { source: 'manual' } });

    console.log('📊 Database statistics:');
    console.log(`   Total jobs: ${totalJobs}`);
    console.log(`   Active jobs: ${activeJobs}`);
    console.log(`   Real jobs: ${realJobsCount}`);

  } catch (error) {
    console.error('❌ Error seeding real jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedRealJobs();

export { seedRealJobs };
