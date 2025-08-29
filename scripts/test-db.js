#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Create a test company
    console.log('   Creating test company...');
    const testCompany = await prisma.company.create({
      data: {
        name: 'Test Company',
        description: 'A test company for verification',
        location: 'Test Location',
        industry: 'Test Industry'
      }
    });
    console.log(`   ✅ Created test company: ${testCompany.id}`);
    
    // Create a test category
    console.log('   Creating test category...');
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'A test category for verification'
      }
    });
    console.log(`   ✅ Created test category: ${testCategory.id}`);
    
    // Check counts
    const companyCount = await prisma.company.count();
    const categoryCount = await prisma.category.count();
    const jobCount = await prisma.job.count();
    
    console.log(`📊 Current counts:`);
    console.log(`   Companies: ${companyCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Jobs: ${jobCount}`);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await prisma.company.delete({ where: { id: testCompany.id } });
    await prisma.category.delete({ where: { id: testCategory.id } });
    console.log('   ✅ Test data cleaned up');
    
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();




















