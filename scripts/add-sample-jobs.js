import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleJobs() {
  try {
    console.log('🚀 Adding sample jobs to database...');

    // First, create a sample company
    const company = await prisma.company.upsert({
      where: { name: 'Sample Tech Company' },
      update: {},
      create: {
        name: 'Sample Tech Company',
        description: 'A leading technology company',
        logo: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=STC',
        website: 'https://sampletech.com',
        location: 'Bangalore, India',
        industry: 'Technology',
        size: '51-200',
        founded: 2020,
        isVerified: true,
        userId: 'sample-user-id' // You might need to create a user first
      }
    });

    console.log('✅ Company created:', company.name);

    // Add sample jobs
    const sampleJobs = [
      {
        title: 'Senior Software Developer',
        company: 'Sample Tech Company',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'We are looking for a Senior Software Developer to join our team. You will be responsible for developing high-quality software solutions and working with cutting-edge technologies.',
        requirements: 'Bachelor\'s degree in Computer Science, 5+ years of experience, proficiency in JavaScript, React, Node.js',
        salary: '800000 - 1200000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        isActive: true,
        sector: 'Technology',
        views: 0,
        applicationsCount: 0,
        companyId: company.id,
        source: 'manual',
        sourceId: 'sample-job-1'
      },
      {
        title: 'Frontend Developer',
        company: 'Sample Tech Company',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Join our frontend team to build amazing user interfaces. We use modern technologies like React, Next.js, and Tailwind CSS.',
        requirements: '3+ years of frontend experience, React, HTML, CSS, JavaScript',
        salary: '600000 - 900000',
        salaryMin: 600000,
        salaryMax: 900000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['React', 'Next.js', 'Tailwind CSS', 'JavaScript', 'HTML', 'CSS'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        isActive: true,
        sector: 'Technology',
        views: 0,
        applicationsCount: 0,
        companyId: company.id,
        source: 'manual',
        sourceId: 'sample-job-2'
      },
      {
        title: 'DevOps Engineer',
        company: 'Sample Tech Company',
        location: 'Delhi, India',
        country: 'IN',
        description: 'We need a DevOps Engineer to help us scale our infrastructure and improve our deployment processes.',
        requirements: 'AWS, Docker, Kubernetes, CI/CD, Linux administration',
        salary: '700000 - 1100000',
        salaryMin: 700000,
        salaryMax: 1100000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
        isRemote: false,
        isHybrid: true,
        isUrgent: true,
        isFeatured: false,
        isActive: true,
        sector: 'Technology',
        views: 0,
        applicationsCount: 0,
        companyId: company.id,
        source: 'manual',
        sourceId: 'sample-job-3'
      }
    ];

    for (const jobData of sampleJobs) {
      const job = await prisma.job.create({
        data: jobData
      });
      console.log(`✅ Job created: ${job.title}`);
    }

    console.log('🎉 Sample jobs added successfully!');
    
    // Check total jobs count
    const totalJobs = await prisma.job.count();
    console.log(`📊 Total jobs in database: ${totalJobs}`);

  } catch (error) {
    console.error('❌ Error adding sample jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleJobs();
