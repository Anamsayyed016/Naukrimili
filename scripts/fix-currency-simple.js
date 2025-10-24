const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrencyIssues() {
  try {
    console.log('🔧 Fixing currency issues in existing jobs...');
    
    // Update all jobs with USD currency to INR if they are in India
    const result = await prisma.job.updateMany({
      where: {
        OR: [
          { salaryCurrency: 'USD' },
          { salaryCurrency: null },
          { country: 'IN' }
        ]
      },
      data: {
        salaryCurrency: 'INR'
      }
    });
    
    console.log(`✅ Updated ${result.count} jobs to use INR currency`);
    
    // Fix salary strings that have $ symbols
    const jobsWithDollarSigns = await prisma.job.findMany({
      where: {
        salary: {
          contains: '$'
        }
      },
      select: {
        id: true,
        salary: true
      }
    });
    
    console.log(`📊 Found ${jobsWithDollarSigns.length} jobs with $ symbols to fix`);
    
    for (const job of jobsWithDollarSigns) {
      const newSalary = job.salary.replace(/\$/g, '₹');
      await prisma.job.update({
        where: { id: job.id },
        data: { salary: newSalary }
      });
      console.log(`✅ Fixed job ${job.id}: ${job.salary} → ${newSalary}`);
    }
    
    console.log('🎉 Currency fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing currency issues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixCurrencyIssues();
