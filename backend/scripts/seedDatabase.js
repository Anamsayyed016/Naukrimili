const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/684a343781fbf8092e0fc47f';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding.');

    // Clear existing data
    console.log('🧹 Clearing old data...');
    await Job.deleteMany({});
    await Company.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️ Old data cleared.');

    // --- Create Users ---
    console.log('Creating users...');
    const password = await bcrypt.hash('password123', 10);
    const users = await User.create([
      { name: 'Company Admin', email: 'admin@company.com', password, role: 'company' },
      { name: 'Job Seeker', email: 'seeker@example.com', password, role: 'jobseeker' },
    ]);
    const companyAdmin = users[0];
    console.log(`👍 ${users.length} users created.`);

    // --- Create Companies ---
    console.log('Creating companies...');
    const companies = await Company.create([
      {
        name: 'InnovateTech Solutions',
        description: 'A leading provider of innovative tech solutions.',
        industry: 'Technology',
        size: '51-200',
        headquarters: { city: 'Mumbai', state: 'Maharashtra' },
        email: 'contact@innovate.tech',
        website: 'https://innovate.tech',
        createdBy: companyAdmin._id,
      },
       {
        name: 'HealthWell Dynamics',
        description: 'Pioneering the future of digital health.',
        industry: 'Healthcare',
        size: '201-1000',
        headquarters: { city: 'Bengaluru', state: 'Karnataka' },
        email: 'hr@healthwell.com',
        website: 'https://healthwell.com',
        createdBy: companyAdmin._id,
      }
    ]);
    const innovateTech = companies[0];
    const healthWell = companies[1];
    console.log(`👍 ${companies.length} companies created.`);

    // --- Create Jobs ---
    console.log('Creating jobs...');
    const jobs = await Job.create([
      {
        title: 'Senior Frontend Developer (React)',
        description: 'We are seeking an experienced React developer to build amazing user interfaces.',
        company: innovateTech._id,
        location: { city: 'Mumbai', state: 'Maharashtra', isRemote: true },
        salary: { min: 1500000, max: 2500000 },
        jobType: 'full-time',
        experienceLevel: 'senior',
        category: 'Software Development',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
        applicationDeadline: new Date('2024-12-31'),
        postedBy: companyAdmin._id,
      },
      {
        title: 'Backend Engineer (Node.js)',
        description: 'Join our backend team to build scalable and robust APIs.',
        company: innovateTech._id,
        location: { city: 'Pune', state: 'Maharashtra' },
        salary: { min: 1200000, max: 2000000 },
        jobType: 'full-time',
        experienceLevel: 'mid',
        category: 'Software Development',
        skills: ['Node.js', 'Express', 'MongoDB', 'AWS'],
        applicationDeadline: new Date('2024-12-31'),
        postedBy: companyAdmin._id,
      },
      {
        title: 'Product Manager - Digital Health',
        description: 'Lead the product strategy for our new line of digital health solutions.',
        company: healthWell._id,
        location: { city: 'Bengaluru', state: 'Karnataka' },
        salary: { min: 2000000, max: 3000000 },
        jobType: 'full-time',
        experienceLevel: 'senior',
        category: 'Product Management',
        skills: ['Product Strategy', 'Agile', 'Healthcare IT'],
        applicationDeadline: new Date('2024-11-30'),
        postedBy: companyAdmin._id,
      }
    ]);
    console.log(`👍 ${jobs.length} jobs created.`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected.');
  }
};

seedData(); 