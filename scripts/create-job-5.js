/**
 * Create Job with ID 5
 * Creates a specific job with ID 5 to match the URL pattern
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createJob5() {
  try {
    console.log('🔧 Creating job with ID 5...');

    // Check if job with ID 5 already exists
    const existingJob = await prisma.job.findUnique({
      where: { id: 5 }
    });

    if (existingJob) {
      console.log('✅ Job with ID 5 already exists:', existingJob.title);
      return;
    }

    // Create the job with specific ID 5
    const job = await prisma.job.create({
      data: {
        id: 5, // Explicitly set ID to 5
        source: 'manual',
        sourceId: 'manual_fullstack_005',
        title: 'Full Stack Python Developer',
        company: 'NaukriMili',
        location: 'Jaisalmer, Rajasthan, India',
        country: 'IN',
        description: 'We are looking for a talented Full Stack Python Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using Python, Django, and modern frontend technologies.',
        requirements: 'Bachelor\'s degree in Computer Science or related field, 3+ years experience with Python, Django, React, and database technologies',
        skills: 'Python, Django, React, JavaScript, PostgreSQL, Git, REST APIs',
        jobType: 'Full-time',
        experienceLevel: 'Mid Level (3-5 years)',
        salary: '₹8,00,000 - ₹12,00,000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        isActive: true,
        sector: 'Technology',
        views: 0,
        applicationsCount: 0,
        postedAt: new Date(),
        rawJson: {
          source: 'manual',
          createdBy: 'system',
          aiEnhanced: true,
          enhancedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Successfully created job with ID 5:', job.title);
    console.log('📋 Job details:', {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary
    });

  } catch (error) {
    console.error('❌ Error creating job with ID 5:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createJob5();
