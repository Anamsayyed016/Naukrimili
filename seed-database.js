/**
 * Seed Script - Add Sample Data for Testing Enhanced APIs
 * This will populate the database with test data to verify real data integration
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create test users
    console.log('👥 Creating test users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user1 = await prisma.user.create({
      data: {
        email: 'jobseeker@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'jobseeker',
        location: 'Mumbai, India',
        bio: 'Experienced software developer looking for new opportunities',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience: '5+ years in full-stack development',
        isVerified: true,
        isActive: true,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'employer@test.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'employer',
        location: 'Bangalore, India',
        bio: 'HR Manager at Tech Company',
        isVerified: true,
        isActive: true,
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        location: 'Delhi, India',
        isVerified: true,
        isActive: true,
      },
    });

    console.log(`✅ Created ${3} test users\n`);

    // Create test jobs
    console.log('💼 Creating test jobs...');
    
    const jobs = [
      {
        title: 'Senior React Developer',
        company: 'TechCorp India',
        companyLogo: 'https://via.placeholder.com/100x100?text=TC',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'We are looking for a Senior React Developer to join our team. You will be responsible for developing and maintaining web applications using React.js.',
        salary: '₹8-15 LPA',
        salaryMin: 800000,
        salaryMax: 1500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['React', 'JavaScript', 'TypeScript', 'Redux'],
        isRemote: false,
        isHybrid: true,
        isFeatured: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'job001',
        createdBy: user2.id,
        rawJson: { manual_entry: true },
      },
      {
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Join our dynamic startup as a Full Stack Developer. Work with modern technologies and help build innovative products.',
        salary: '₹6-12 LPA',
        salaryMin: 600000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Node.js', 'React', 'MongoDB', 'Express'],
        isRemote: true,
        isUrgent: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'job002',
        createdBy: user2.id,
        rawJson: { manual_entry: true },
      },
      {
        title: 'Python Developer',
        company: 'Data Solutions Inc',
        location: 'Hyderabad, India',
        country: 'IN',
        description: 'Looking for a Python Developer to work on data analytics and machine learning projects.',
        salary: '₹7-14 LPA',
        salaryMin: 700000,
        salaryMax: 1400000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Python', 'Django', 'Machine Learning', 'SQL'],
        isRemote: false,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'job003',
        createdBy: user2.id,
        rawJson: { manual_entry: true },
      },
      {
        title: 'DevOps Engineer',
        company: 'CloudTech Solutions',
        location: 'Pune, India',
        country: 'IN',
        description: 'We need a DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
        salary: '₹9-18 LPA',
        salaryMin: 900000,
        salaryMax: 1800000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins'],
        isRemote: true,
        isFeatured: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'job004',
        createdBy: user2.id,
        rawJson: { manual_entry: true },
      },
      {
        title: 'Frontend Developer Intern',
        company: 'Design Studio',
        location: 'Gurgaon, India',
        country: 'IN',
        description: 'Internship opportunity for Frontend Developer. Learn and work with experienced team.',
        salary: '₹15,000-25,000 per month',
        salaryMin: 15000,
        salaryMax: 25000,
        salaryCurrency: 'INR',
        jobType: 'internship',
        experienceLevel: 'entry',
        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
        isRemote: false,
        isHybrid: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'job005',
        createdBy: user2.id,
        rawJson: { manual_entry: true },
      },
    ];

    const createdJobs = [];
    for (const jobData of jobs) {
      const job = await prisma.job.create({ data: jobData });
      createdJobs.push(job);
    }

    console.log(`✅ Created ${createdJobs.length} test jobs\n`);

    // Create test bookmarks
    console.log('⭐ Creating test bookmarks...');
    
    await prisma.jobBookmark.create({
      data: {
        userId: user1.id,
        jobId: createdJobs[0].id,
        notes: 'Interested in this React position',
      },
    });

    await prisma.jobBookmark.create({
      data: {
        userId: user1.id,
        jobId: createdJobs[3].id,
        notes: 'Good DevOps opportunity',
      },
    });

    console.log(`✅ Created ${2} test bookmarks\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    
    console.log('📊 Summary:');
    console.log(`- Users: ${3} (1 jobseeker, 1 employer, 1 admin)`);
    console.log(`- Jobs: ${createdJobs.length} (various roles and companies)`);
    console.log(`- Bookmarks: ${2} (user favorites)`);
    console.log('\n🚀 You can now test the enhanced APIs with real data!');
    
    console.log('\n🔑 Test Credentials:');
    console.log('Jobseeker: jobseeker@test.com / password123');
    console.log('Employer: employer@test.com / password123');
    console.log('Admin: admin@test.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase();
