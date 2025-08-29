#!/usr/bin/env node

/**
 * DATABASE FIX SCRIPT
 * Fixes missing companies and categories
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('🔧 Starting database fix...');
    
    // Check current status
    const jobCount = await prisma.job.count();
    const companyCount = await prisma.company.count();
    const categoryCount = await prisma.category.count();
    
    console.log(`📊 Current status:`);
    console.log(`   Jobs: ${jobCount}`);
    console.log(`   Companies: ${companyCount}`);
    console.log(`   Categories: ${categoryCount}`);
    
    // Create companies if missing
    if (companyCount === 0) {
      console.log('🏢 Creating companies...');
      const companies = [
        {
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
      
      for (const company of companies) {
        const created = await prisma.company.create({ data: company });
        console.log(`   ✅ Created: ${created.name}`);
      }
    }
    
    // Create categories if missing
    if (categoryCount === 0) {
      console.log('📂 Creating categories...');
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
      
      for (const category of categories) {
        const created = await prisma.category.create({ data: category });
        console.log(`   ✅ Created: ${created.name}`);
      }
    }
    
    // Final status check
    const finalJobCount = await prisma.job.count();
    const finalCompanyCount = await prisma.company.count();
    const finalCategoryCount = await prisma.category.count();
    
    console.log(`\n📊 Final status:`);
    console.log(`   Jobs: ${finalJobCount}`);
    console.log(`   Companies: ${finalCompanyCount}`);
    console.log(`   Categories: ${finalCategoryCount}`);
    
    if (finalCompanyCount > 0 && finalCategoryCount > 0) {
      console.log('✅ Database fix completed successfully!');
    } else {
      console.log('❌ Database fix failed!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    console.error('Error details:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDatabase();




















