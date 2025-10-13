#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCompaniesWithJobs() {
  try {
    console.log('🔍 Finding companies that have jobs but are not verified...');
    
    // Find companies that have active jobs but are not verified
    const companiesWithJobs = await prisma.company.findMany({
      where: {
        jobs: {
          some: {
            isActive: true
          }
        },
        isVerified: false
      },
      include: {
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${companiesWithJobs.length} companies with jobs that need verification:`);
    
    for (const company of companiesWithJobs) {
      console.log(`   • ${company.name}: ${company._count.jobs} active jobs`);
    }

    if (companiesWithJobs.length === 0) {
      console.log('✅ All companies with jobs are already verified!');
      return;
    }

    console.log('\n🔧 Verifying companies...');
    
    // Verify all these companies
    const result = await prisma.company.updateMany({
      where: {
        jobs: {
          some: {
            isActive: true
          }
        },
        isVerified: false
      },
      data: {
        isVerified: true
      }
    });

    console.log(`✅ Verified ${result.count} companies successfully!`);
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifiedCompanies = await prisma.company.findMany({
      where: {
        jobs: {
          some: {
            isActive: true
          }
        },
        isVerified: true
      },
      select: {
        name: true,
        isVerified: true,
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Companies with jobs now verified:`);
    verifiedCompanies.forEach(company => {
      console.log(`   ✅ ${company.name}: ${company._count.jobs} jobs (verified: ${company.isVerified})`);
    });

    console.log('\n🎉 Companies verification completed! They should now appear in the companies directory with correct job counts.');

  } catch (error) {
    console.error('❌ Error verifying companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCompaniesWithJobs();
