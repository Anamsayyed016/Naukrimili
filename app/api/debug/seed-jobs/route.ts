import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding jobs...');
    
    // Sample job data
    const sampleJobs = [
      {
        title: 'UI/UX Designer',
        company: 'GrowthCorp',
        location: 'Berlin, Germany',
        salary: '€60,000 - €150,000',
        description: 'We are looking for a creative UI/UX Designer to join our growing team in Berlin. You will be responsible for designing user interfaces and experiences for our digital products.',
        requirements: '3+ years of experience in UI/UX design, proficiency in Figma, Adobe Creative Suite, and design systems.',
        type: 'Full-time',
        experience: 'Mid-level',
        industry: 'Technology',
        source: 'manual',
        sourceId: '31',
        postedAt: new Date(),
        companyRelation: {
          create: {
            name: 'GrowthCorp',
            location: 'Berlin, Germany',
            industry: 'Technology',
            website: 'https://growthcorp.com'
          }
        }
      },
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$120,000 - $180,000',
        description: 'Join our engineering team as a Senior Software Engineer. You will work on cutting-edge technology and help build scalable solutions.',
        requirements: '5+ years of software development experience, proficiency in JavaScript, React, Node.js, and cloud technologies.',
        type: 'Full-time',
        experience: 'Senior',
        industry: 'Technology',
        source: 'manual',
        sourceId: '32',
        postedAt: new Date(),
        companyRelation: {
          create: {
            name: 'TechCorp',
            location: 'San Francisco, CA',
            industry: 'Technology',
            website: 'https://techcorp.com'
          }
        }
      },
      {
        title: 'Marketing Manager',
        company: 'BrandCo',
        location: 'New York, NY',
        salary: '$70,000 - $100,000',
        description: 'We are seeking a Marketing Manager to lead our marketing initiatives and drive brand awareness.',
        requirements: '3+ years of marketing experience, strong communication skills, and experience with digital marketing tools.',
        type: 'Full-time',
        experience: 'Mid-level',
        industry: 'Marketing',
        source: 'manual',
        sourceId: '33',
        postedAt: new Date(),
        companyRelation: {
          create: {
            name: 'BrandCo',
            location: 'New York, NY',
            industry: 'Marketing',
            website: 'https://brandco.com'
          }
        }
      }
    ];

    // Clear existing manual jobs first
    await prisma.job.deleteMany({
      where: { source: 'manual' }
    });

    // Insert sample jobs
    for (const jobData of sampleJobs) {
      await prisma.job.create({
        data: jobData
      });
    }

    console.log('✅ Successfully seeded jobs');

    return NextResponse.json({
      success: true,
      message: 'Jobs seeded successfully',
      count: (sampleJobs || []).length,
      jobs: sampleJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        sourceId: job.sourceId
      }))
    });

  } catch (error: any) {
    console.error('❌ Error seeding jobs:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to seed jobs',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const jobCount = await prisma.job.count();
    const manualJobs = await prisma.job.findMany({
      where: { source: 'manual' },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        sourceId: true
      }
    });

    return NextResponse.json({
      success: true,
      totalJobs: jobCount,
      manualJobs: manualJobs,
      message: `Found ${jobCount} total jobs, ${(manualJobs || []).length} manual jobs`
    });

  } catch (error: any) {
    console.error('❌ Error checking jobs:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check jobs',
      details: error.message
    }, { status: 500 });
  }
}
