/**
 * Start Job Automation System
 * Initializes and starts the comprehensive job automation system
 */

import { jobAutomationSystem } from '../lib/automation/job-automation-system.js';

async function startAutomation() {
  try {
    console.log('🚀 Starting Job Automation System...');
    
    // Start the automation system
    await jobAutomationSystem.start();
    
    console.log('✅ Job Automation System started successfully');
    console.log('📊 System Status:');
    
    const status = await jobAutomationSystem.getStatus();
    console.log(`   - Running: ${status.isRunning}`);
    console.log(`   - Total Jobs: ${status.stats.totalJobs}`);
    console.log(`   - Active Jobs: ${status.stats.activeJobs}`);
    console.log(`   - External Jobs: ${status.stats.externalJobs}`);
    console.log(`   - Employer Jobs: ${status.stats.employerJobs}`);
    console.log(`   - Quality Score: ${status.stats.qualityScore.toFixed(2)}`);
    console.log(`   - Sources: ${status.sources.length}`);
    
    // Keep the process running
    console.log('⏰ Automation system is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down automation system...');
      await jobAutomationSystem.stop();
      console.log('✅ Automation system stopped');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down automation system...');
      await jobAutomationSystem.stop();
      console.log('✅ Automation system stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start automation system:', error);
    process.exit(1);
  }
}

// Start the automation system
startAutomation();
