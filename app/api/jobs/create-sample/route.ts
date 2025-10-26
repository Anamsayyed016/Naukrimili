import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SAMPLE_JOBS = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp India',
    location: 'Bangalore',
    country: 'IN',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
    requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: '₹15,00,000 - ₹25,00,000',
    isRemote: false,
    isFeatured: true,
    isActive: true,
    source: 'manual',
    sourceId: 'sample-1'
  },
  {
    title: 'Frontend Developer',
    company: 'Digital Solutions Ltd',
    location: 'Mumbai',
    country: 'IN',
    description: 'Join our frontend team to build beautiful and responsive user interfaces. Experience with modern JavaScript frameworks required.',
    requirements: ['JavaScript', 'React', 'CSS', 'HTML'],
    skills: ['JavaScript', 'React', 'Vue.js', 'CSS3', 'HTML5', 'Webpack'],
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: '₹8,00,000 - ₹15,00,000',
    isRemote: true,
    isFeatured: false,
    isActive: true,
    source: 'manual',
    sourceId: 'sample-2'
  },
  {
    title: 'Data Analyst',
    company: 'Analytics Pro',
    location: 'Delhi',
    country: 'IN',
    description: 'We need a Data Analyst to help us make sense of large datasets and provide insights to drive business decisions.',
    requirements: ['Python', 'SQL', 'Excel', 'Statistics'],
    skills: ['Python', 'SQL', 'Excel', 'Statistics', 'Tableau', 'Power BI'],
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: '₹6,00,000 - ₹12,00,000',
    isRemote: false,
    isFeatured: false,
    isActive: true,
    source: 'manual',
    sourceId: 'sample-3'
  },
  {
    title: 'Product Manager',
    company: 'InnovateTech',
    location: 'Hyderabad',
    country: 'IN',
    description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional user experiences.',
    requirements: ['Product Management', 'Agile', 'User Research', 'Analytics'],
    skills: ['Product Management', 'Agile', 'User Research', 'Analytics', 'Figma', 'JIRA'],
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: '₹20,00,000 - ₹35,00,000',
    isRemote: true,
    isFeatured: true,
    isActive: true,
    source: 'manual',
    sourceId: 'sample-4'
  },
  {
    title: 'DevOps Engineer',
    company: 'Cloud Systems',
    location: 'Pune',
    country: 'IN',
    description: 'Build and maintain our cloud infrastructure. Automate deployment processes and ensure system reliability.',
    requirements: ['AWS', 'Docker', 'Kubernetes', 'Linux'],
    skills: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Terraform', 'Jenkins'],
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: '₹12,00,000 - ₹20,00,000',
    isRemote: false,
    isFeatured: false,
    isActive: true,
    source: 'manual',
    sourceId: 'sample-5'
  }
];

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Creating sample jobs...');
    
    // Check if sample jobs already exist
    const existingCount = await prisma.job.count({
      where: { source: 'manual', sourceId: { startsWith: 'sample-' } }
    });
    
    if (existingCount > 0) {
      console.log(`⚠️ Sample jobs already exist (${existingCount} found)`);
      return NextResponse.json({
        success: true,
        message: 'Sample jobs already exist',
        existingCount,
        timestamp: new Date().toISOString()
      });
    }
    
    // Create sample jobs
    const createdJobs = await prisma.job.createMany({
      data: SAMPLE_JOBS.map(job => ({
        ...job,
        requirements: JSON.stringify(job.requirements),
        skills: JSON.stringify(job.skills)
      }))
    });
    
    console.log(`✅ Created ${createdJobs.count} sample jobs`);
    
    // Fetch the created jobs to return
    const jobs = await prisma.job.findMany({
      where: { source: 'manual', sourceId: { startsWith: 'sample-' } },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Sample jobs created successfully',
      createdCount: createdJobs.count,
      jobs: jobs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Failed to create sample jobs:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create sample jobs',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
