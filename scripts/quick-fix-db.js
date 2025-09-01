#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickFixDB() {
  try {
    console.log('🚀 Quick database fix starting...');
    
    // Create companies
    console.log('🏢 Creating companies...');
    const companies = [
      { name: 'TechCorp Solutions', description: 'Leading tech company', location: 'Bangalore', industry: 'Technology' },
      { name: 'FinTech Innovations', description: 'Financial technology leader', location: 'Mumbai', industry: 'Finance' },
      { name: 'HealthTech Systems', description: 'Healthcare technology', location: 'Hyderabad', industry: 'Healthcare' },
      { name: 'EduTech Pro', description: 'Educational technology', location: 'Delhi', industry: 'Education' },
      { name: 'Green Energy Corp', description: 'Sustainable energy', location: 'Chennai', industry: 'Energy' }
    ];
    
    for (const company of companies) {
      await prisma.company.create({ data: company });
      console.log(`   ✅ ${company.name}`);
    }
    
    // Create categories
    console.log('📂 Creating categories...');
    const categories = [
      { name: 'Technology', description: 'Software development and IT' },
      { name: 'Finance', description: 'Banking and fintech' },
      { name: 'Healthcare', description: 'Medical technology' },
      { name: 'Education', description: 'EdTech and training' },
      { name: 'Energy', description: 'Renewable energy' },
      { name: 'Marketing', description: 'Digital marketing' },
      { name: 'Sales', description: 'Business development' },
      { name: 'Design', description: 'UI/UX design' }
    ];
    
    for (const category of categories) {
      await prisma.category.create({ data: category });
      console.log(`   ✅ ${category.name}`);
    }
    
    console.log('✅ Database quick fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickFixDB();






















