/**
 * Complete Real Jobs Seeding Script
 * Creates comprehensive real jobs with proper IDs for the job portal
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realJobs = [
  // Technology Jobs
  {
    id: 1,
    title: 'Senior Software Engineer',
    company: 'TechCorp India',
    location: 'Bangalore, India',
    country: 'IN',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions using modern technologies like React, Node.js, and cloud platforms.',
    requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience with React, Node.js, and cloud technologies',
    skills: 'React, Node.js, AWS, MongoDB, TypeScript, Docker, Kubernetes',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    salary: '₹12,00,000 - ₹18,00,000',
    salaryMin: 1200000,
    salaryMax: 1800000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, flexible hours, remote work options, stock options',
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
    id: 2,
    title: 'Product Manager',
    company: 'InnovateTech',
    location: 'Hyderabad, India',
    country: 'IN',
    description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional user experiences and drive business growth through data-driven decisions.',
    requirements: 'MBA or equivalent, 3+ years product management experience, strong analytical skills',
    skills: 'Product Management, Analytics, Agile, User Research, Figma, SQL',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '₹15,00,000 - ₹25,00,000',
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: 'INR',
    benefits: 'Stock options, health insurance, professional development, flexible work',
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
    id: 3,
    title: 'Full Stack Developer',
    company: 'WebCraft Solutions',
    location: 'Mumbai, India',
    country: 'IN',
    description: 'Join our dynamic team as a Full Stack Developer. You will work on exciting projects using modern web technologies and contribute to building scalable applications.',
    requirements: 'Bachelor\'s degree in Computer Science, 2+ years experience with web development',
    skills: 'JavaScript, React, Node.js, MongoDB, Express, Git, REST APIs',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (2-4 years)',
    salary: '₹8,00,000 - ₹15,00,000',
    salaryMin: 800000,
    salaryMax: 1500000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, learning budget, flexible hours',
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
    id: 4,
    title: 'Data Scientist',
    company: 'DataInsights Ltd',
    location: 'Pune, India',
    country: 'IN',
    description: 'We are seeking a talented Data Scientist to join our analytics team. You will work on machine learning projects, data analysis, and help drive business insights.',
    requirements: 'Master\'s degree in Data Science or related field, 3+ years experience with ML and Python',
    skills: 'Python, Machine Learning, SQL, TensorFlow, Pandas, NumPy, Statistics',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '₹10,00,000 - ₹18,00,000',
    salaryMin: 1000000,
    salaryMax: 1800000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, research budget, conference attendance',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_004',
    isActive: true
  },
  {
    id: 5,
    title: 'Full Stack Python Developer',
    company: 'NaukriMili',
    location: 'Jaisalmer, Rajasthan, India',
    country: 'IN',
    description: 'We are looking for a talented Full Stack Python Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using Python, Django, and modern frontend technologies.',
    requirements: 'Bachelor\'s degree in Computer Science or related field, 3+ years experience with Python, Django, React, and database technologies',
    skills: 'Python, Django, React, JavaScript, PostgreSQL, Git, REST APIs, Docker',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '₹8,00,000 - ₹12,00,000',
    salaryMin: 800000,
    salaryMax: 1200000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, flexible hours, remote work options, learning budget',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_fullstack_005',
    isActive: true
  },
  {
    id: 6,
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    location: 'Chennai, India',
    country: 'IN',
    description: 'Join our DevOps team to help build and maintain our cloud infrastructure. You will work with cutting-edge technologies and help scale our applications.',
    requirements: 'Bachelor\'s degree in Computer Science, 3+ years experience with cloud platforms and automation',
    skills: 'AWS, Docker, Kubernetes, Terraform, Jenkins, Linux, Python, Bash',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '₹12,00,000 - ₹20,00,000',
    salaryMin: 1200000,
    salaryMax: 2000000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, cloud certification budget, flexible work',
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_tech_006',
    isActive: true
  },
  {
    id: 7,
    title: 'UI/UX Designer',
    company: 'DesignStudio Pro',
    location: 'Delhi, India',
    country: 'IN',
    description: 'We are looking for a creative UI/UX Designer to join our design team. You will create beautiful and functional user interfaces for our digital products.',
    requirements: 'Bachelor\'s degree in Design or related field, 2+ years experience with design tools',
    skills: 'Figma, Adobe Creative Suite, Sketch, Prototyping, User Research, HTML/CSS',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (2-4 years)',
    salary: '₹6,00,000 - ₹12,00,000',
    salaryMin: 600000,
    salaryMax: 1200000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, design software license, creative freedom',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Technology',
    source: 'manual',
    sourceId: 'manual_design_007',
    isActive: true
  },
  {
    id: 8,
    title: 'Marketing Manager',
    company: 'GrowthHackers Inc',
    location: 'Gurgaon, India',
    country: 'IN',
    description: 'Lead our marketing efforts and drive growth through innovative campaigns. You will work with cross-functional teams to develop and execute marketing strategies.',
    requirements: 'Bachelor\'s degree in Marketing or related field, 4+ years marketing experience',
    skills: 'Digital Marketing, Google Analytics, Social Media, Content Marketing, SEO, SEM',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (4-6 years)',
    salary: '₹8,00,000 - ₹15,00,000',
    salaryMin: 800000,
    salaryMax: 1500000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, marketing budget, performance bonuses',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Marketing',
    source: 'manual',
    sourceId: 'manual_marketing_008',
    isActive: true
  },
  {
    id: 9,
    title: 'Sales Executive',
    company: 'SalesForce Pro',
    location: 'Kolkata, India',
    country: 'IN',
    description: 'Join our sales team and help drive revenue growth. You will be responsible for building relationships with clients and closing deals.',
    requirements: 'Bachelor\'s degree in Business or related field, 2+ years sales experience',
    skills: 'Sales, CRM, Communication, Negotiation, Lead Generation, Customer Relations',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (2-4 years)',
    salary: '₹5,00,000 - ₹10,00,000',
    salaryMin: 500000,
    salaryMax: 1000000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, commission structure, travel allowance',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'Sales',
    source: 'manual',
    sourceId: 'manual_sales_009',
    isActive: true
  },
  {
    id: 10,
    title: 'HR Manager',
    company: 'PeopleFirst Corp',
    location: 'Ahmedabad, India',
    country: 'IN',
    description: 'Lead our human resources department and help build a great company culture. You will be responsible for recruitment, employee relations, and HR policies.',
    requirements: 'Bachelor\'s degree in HR or related field, 5+ years HR experience',
    skills: 'Human Resources, Recruitment, Employee Relations, HR Policies, Payroll, Training',
    jobType: 'Full-time',
    experienceLevel: 'Senior Level (5+ years)',
    salary: '₹7,00,000 - ₹14,00,000',
    salaryMin: 700000,
    salaryMax: 1400000,
    salaryCurrency: 'INR',
    benefits: 'Health insurance, professional development, flexible work',
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: false,
    sector: 'Human Resources',
    source: 'manual',
    sourceId: 'manual_hr_010',
    isActive: true
  }
];

async function seedRealJobsComplete() {
  try {
    console.log('🌱 Starting comprehensive real jobs seeding...');

    // Clear existing sample jobs and any conflicting jobs
    await prisma.job.deleteMany({
      where: {
        OR: [
          { source: 'sample' },
          { id: { in: realJobs.map(job => job.id) } }
        ]
      }
    });
    console.log('✅ Cleared existing sample jobs and conflicting jobs');

    // Insert real jobs with specific IDs
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
            enhancedAt: new Date().toISOString(),
            createdBy: 'system'
          }
        }
      });
      console.log(`✅ Created job ${job.id}: ${job.title} at ${job.company}`);
    }

    console.log(`✅ Successfully seeded ${realJobs.length} real jobs with proper IDs`);

    // Verify the seeding
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({ where: { isActive: true } });
    const realJobsCount = await prisma.job.count({ where: { source: 'manual' } });
    const sampleJobsCount = await prisma.job.count({ where: { source: 'sample' } });

    console.log('📊 Database statistics after seeding:');
    console.log(`   Total jobs: ${totalJobs}`);
    console.log(`   Active jobs: ${activeJobs}`);
    console.log(`   Real jobs: ${realJobsCount}`);
    console.log(`   Sample jobs: ${sampleJobsCount}`);

    // Test job IDs
    console.log('\n🔍 Testing job IDs:');
    for (let i = 1; i <= 10; i++) {
      const job = await prisma.job.findUnique({
        where: { id: i },
        select: { id: true, title: true, company: true, isActive: true }
      });
      if (job) {
        console.log(`   ✅ Job ${i}: ${job.title} at ${job.company}`);
      } else {
        console.log(`   ❌ Job ${i}: Not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding real jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedRealJobsComplete();
