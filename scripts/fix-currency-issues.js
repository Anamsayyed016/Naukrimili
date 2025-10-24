const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrencyIssues() {
  try {
    console.log('🔧 Fixing currency issues in existing jobs...');
    
    // Find jobs with USD currency that should be INR based on country
    const jobsToFix = await prisma.job.findMany({
      where: {
        OR: [
          { salaryCurrency: 'USD' },
          { salaryCurrency: null },
          { country: 'IN' }
        ]
      },
      select: {
        id: true,
        title: true,
        company: true,
        country: true,
        salaryCurrency: true,
        salary: true,
        salaryMin: true,
        salaryMax: true
      }
    });
    
    console.log(`📊 Found ${jobsToFix.length} jobs to fix`);
    
    let fixedCount = 0;
    
    for (const job of jobsToFix) {
      let newCurrency = 'INR'; // Default to INR
      
      // Determine correct currency based on country
      if (job.country === 'US') {
        newCurrency = 'USD';
      } else if (job.country === 'GB' || job.country === 'UK') {
        newCurrency = 'GBP';
      } else if (job.country === 'CA') {
        newCurrency = 'CAD';
      } else if (job.country === 'AU') {
        newCurrency = 'AUD';
      } else if (job.country === 'DE') {
        newCurrency = 'EUR';
      } else if (job.country === 'FR') {
        newCurrency = 'EUR';
      } else if (job.country === 'IN') {
        newCurrency = 'INR';
      }
      
      // Update the job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          salaryCurrency: newCurrency
        }
      });
      
      console.log(`✅ Fixed job ${job.id}: ${job.title} at ${job.company} (${job.country} → ${newCurrency})`);
      fixedCount++;
    }
    
    console.log(`🎉 Successfully fixed ${fixedCount} jobs`);
    
    // Also fix any jobs with hardcoded $ symbols in salary strings
    console.log('🔧 Fixing hardcoded $ symbols in salary strings...');
    
    const salaryJobs = await prisma.job.findMany({
      where: {
        salary: {
          contains: '$'
        }
      },
      select: {
        id: true,
        title: true,
        salary: true,
        salaryCurrency: true,
        country: true
      }
    });
    
    console.log(`📊 Found ${salaryJobs.length} jobs with $ symbols to fix`);
    
    for (const job of salaryJobs) {
      let newSalary = job.salary;
      
      // Replace $ with appropriate currency symbol based on country/currency
      if (job.salaryCurrency === 'INR' || job.country === 'IN') {
        newSalary = newSalary.replace(/\$/g, '₹');
      } else if (job.salaryCurrency === 'GBP' || job.country === 'GB' || job.country === 'UK') {
        newSalary = newSalary.replace(/\$/g, '£');
      } else if (job.salaryCurrency === 'EUR' || job.country === 'DE' || job.country === 'FR') {
        newSalary = newSalary.replace(/\$/g, '€');
      }
      
      await prisma.job.update({
        where: { id: job.id },
        data: {
          salary: newSalary
        }
      });
      
      console.log(`✅ Fixed salary string for job ${job.id}: ${job.title}`);
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
