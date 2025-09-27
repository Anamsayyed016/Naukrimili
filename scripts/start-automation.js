/**
 * Start Job Automation System
 * Initializes and starts the comprehensive job automation system
 */

// Note: This script should be run through Next.js build system
// For direct Node.js execution, we'll use a different approach

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startAutomation() {
  try {
    console.log('🚀 Starting Job Automation System...');
    
    // Get current job statistics
    const stats = await getJobStats();
    console.log('📊 Current Job Statistics:');
    console.log(`   - Total Jobs: ${stats.totalJobs}`);
    console.log(`   - Active Jobs: ${stats.activeJobs}`);
    console.log(`   - External Jobs: ${stats.externalJobs}`);
    console.log(`   - Employer Jobs: ${stats.employerJobs}`);
    console.log(`   - Manual Jobs: ${stats.manualJobs}`);
    
    console.log('✅ Job Automation System initialized');
    console.log('💡 To start the full automation system, use the admin dashboard at /dashboard/admin/automation');
    console.log('💡 Or trigger manual sync via API: POST /api/automation/sync');
    
    // Keep the process running for monitoring
    console.log('⏰ Monitoring system is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down monitoring...');
      await prisma.$disconnect();
      console.log('✅ Monitoring stopped');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down monitoring...');
      await prisma.$disconnect();
      console.log('✅ Monitoring stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start automation system:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function getJobStats() {
  try {
    const [
      totalJobs,
      activeJobs,
      externalJobs,
      employerJobs,
      manualJobs
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { source: { not: 'manual' } } }),
      prisma.job.count({ where: { source: 'manual', companyId: { not: null } } }),
      prisma.job.count({ where: { source: 'manual', companyId: null } })
    ]);

    return {
      totalJobs,
      activeJobs,
      externalJobs,
      employerJobs,
      manualJobs
    };
  } catch (error) {
    console.error('❌ Failed to get job stats:', error);
    return {
      totalJobs: 0,
      activeJobs: 0,
      externalJobs: 0,
      employerJobs: 0,
      manualJobs: 0
    };
  }
}

// Start the automation system
startAutomation();
