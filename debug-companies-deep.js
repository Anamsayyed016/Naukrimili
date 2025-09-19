import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function debugCompaniesDeep() {
  try {
    console.log('🔍 Deep Debugging Companies System...\n');

    // 1. Check database companies with exact API filter
    console.log('1️⃣ Checking database with API filter...');
    const dbCompanies = await prisma.company.findMany({
      where: {
        isVerified: true,
        isActive: true,
        jobs: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    console.log(`📊 Database: Found ${dbCompanies.length} companies matching API filter`);
    dbCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Verified: ${company.isVerified}`);
      console.log(`   Active: ${company.isActive}`);
      console.log(`   Jobs: ${company._count.jobs}`);
      console.log('   ---');
    });

    // 2. Check all companies in database
    console.log('\n2️⃣ Checking all companies in database...');
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        isVerified: true,
        isActive: true,
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    console.log(`📊 Total companies: ${allCompanies.length}`);
    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Verified: ${company.isVerified}`);
      console.log(`   Active: ${company.isActive}`);
      console.log(`   Jobs: ${company._count.jobs}`);
      console.log('   ---');
    });

    // 3. Check jobs for each company
    console.log('\n3️⃣ Checking jobs for each company...');
    for (const company of allCompanies) {
      const companyJobs = await prisma.job.findMany({
        where: { companyId: company.id },
        select: {
          id: true,
          title: true,
          isActive: true
        }
      });

      console.log(`\n${company.name}:`);
      console.log(`   Total jobs: ${companyJobs.length}`);
      console.log(`   Active jobs: ${companyJobs.filter(j => j.isActive).length}`);
      
      if (companyJobs.length > 0) {
        companyJobs.forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} (Active: ${job.isActive})`);
        });
      }
    }

    // 4. Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    // Test localhost:3001 (current dev server)
    try {
      console.log('Testing localhost:3001...');
      const response3001 = await fetch('http://localhost:3001/api/companies/public');
      const data3001 = await response3001.json();
      console.log(`✅ localhost:3001: ${data3001.data?.companies?.length || 0} companies`);
    } catch (error) {
      console.log(`❌ localhost:3001: ${error.message}`);
    }

    // Test localhost:3000 (if running)
    try {
      console.log('Testing localhost:3000...');
      const response3000 = await fetch('http://localhost:3000/api/companies/public');
      const data3000 = await response3000.json();
      console.log(`✅ localhost:3000: ${data3000.data?.companies?.length || 0} companies`);
    } catch (error) {
      console.log(`❌ localhost:3000: ${error.message}`);
    }

    // 5. Check if there are any sample companies being returned
    console.log('\n5️⃣ Checking for sample data...');
    const sampleCompanies = await prisma.company.findMany({
      where: {
        id: {
          startsWith: 'sample-'
        }
      }
    });
    console.log(`📝 Sample companies in database: ${sampleCompanies.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompaniesDeep();
