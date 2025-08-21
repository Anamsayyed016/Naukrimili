#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...');
    
    const jobCount = await prisma.job.count();
    const companyCount = await prisma.company.count();
    const categoryCount = await prisma.category.count();
    
    console.log(`📊 Database Status:`);
    console.log(`   Jobs: ${jobCount}`);
    console.log(`   Companies: ${companyCount}`);
    console.log(`   Categories: ${categoryCount}`);
    
    if (jobCount > 0 && companyCount > 0 && categoryCount > 0) {
      console.log('✅ Database is properly populated!');
    } else {
      console.log('⚠️  Database is missing some data');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();








