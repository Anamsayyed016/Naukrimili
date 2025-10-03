#!/usr/bin/env ts-node

/**
 * Daily Report Cron Job
 * 
 * Generates daily reports with job counts, user statistics, and system health
 * Runs daily to provide insights into platform usage
 * 
 * Usage:
 *   npx ts-node scripts/cron-jobs/daily-report.ts
 *   # Add to crontab: 0 9 * * * cd /path/to/project && npx ts-node scripts/cron-jobs/daily-report.ts
 */

import { PrismaClient } from '@prisma/client';
import { EnvironmentManager } from '../setup-env';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface DailyReport {
  date: string;
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalUsers: number;
    activeUsers: number;
    totalCompanies: number;
    totalApplications: number;
    newJobsToday: number;
    newUsersToday: number;
    newApplicationsToday: number;
  };
  topCompanies: Array<{
    name: string;
    jobCount: number;
    applicationCount: number;
  }>;
  topJobTitles: Array<{
    title: string;
    count: number;
    applications: number;
  }>;
  locationStats: Array<{
    location: string;
    jobCount: number;
    userCount: number;
  }>;
  systemHealth: {
    databaseConnected: boolean;
    lastJobSync: string | null;
    errorCount: number;
  };
}

class DailyReportGenerator {
  private prisma: PrismaClient;
  private envManager: EnvironmentManager;

  constructor() {
    this.prisma = new PrismaClient();
    this.envManager = new EnvironmentManager();
  }

  /**
   * Initialize the report generator
   */
  public async initialize(): Promise<void> {
    console.log('📊 Daily Report Generator');
    console.log('=========================');

    await this.envManager.loadEnvironment();
    const envConfig = this.envManager.getEnvironmentConfig();

    console.log(`Environment: ${envConfig.nodeEnv}`);
    console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
  }

  /**
   * Generate the daily report
   */
  public async generateReport(): Promise<DailyReport> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    console.log('\n📈 Collecting statistics...');

    // Basic counts
    const [
      totalJobs,
      activeJobs,
      totalUsers,
      activeUsers,
      totalCompanies,
      totalApplications,
      newJobsToday,
      newUsersToday,
      newApplicationsToday
    ] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.job.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.company.count(),
      this.prisma.application.count(),
      this.prisma.job.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      this.prisma.application.count({
        where: {
          appliedAt: {
            gte: yesterday,
            lt: today
          }
        }
      })
    ]);

    // Top companies by job count
    const topCompanies = await this.prisma.company.findMany({
      select: {
        name: true,
        jobs: {
          select: {
            id: true,
            applications: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: {
        jobs: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Top job titles
    const topJobTitles = await this.prisma.job.groupBy({
      by: ['title'],
      _count: {
        id: true,
        applications: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Location statistics
    const locationStats = await this.prisma.job.groupBy({
      by: ['location'],
      _count: {
        id: true
      },
      where: {
        location: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get user counts by location
    const userLocationStats = await this.prisma.user.groupBy({
      by: ['location'],
      _count: {
        id: true
      },
      where: {
        location: {
          not: null
        }
      }
    });

    // Combine location stats
    const locationStatsWithUsers = locationStats.map(loc => {
      const userCount = userLocationStats.find(ul => ul.location === loc.location)?._count.id || 0;
      return {
        location: loc.location || 'Unknown',
        jobCount: loc._count.id,
        userCount
      };
    });

    // System health check
    const systemHealth = await this.checkSystemHealth();

    const report: DailyReport = {
      date: today.toISOString().split('T')[0],
      summary: {
        totalJobs,
        activeJobs,
        totalUsers,
        activeUsers,
        totalCompanies,
        totalApplications,
        newJobsToday,
        newUsersToday,
        newApplicationsToday
      },
      topCompanies: topCompanies.map(company => ({
        name: company.name,
        jobCount: company.jobs.length,
        applicationCount: company.jobs.reduce((sum, job) => sum + job.applications.length, 0)
      })),
      topJobTitles: topJobTitles.map(job => ({
        title: job.title,
        count: job._count.id,
        applications: job._count.applications
      })),
      locationStats: locationStatsWithUsers,
      systemHealth
    };

    return report;
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<DailyReport['systemHealth']> {
    let databaseConnected = false;
    let lastJobSync: string | null = null;
    let errorCount = 0;

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;

      // Get last job sync time
      const lastJob = await this.prisma.job.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      lastJobSync = lastJob?.createdAt.toISOString() || null;

      // Count errors from today
      errorCount = await this.prisma.mobileError.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
    }

    return {
      databaseConnected,
      lastJobSync,
      errorCount
    };
  }

  /**
   * Format and display the report
   */
  public displayReport(report: DailyReport): void {
    console.log('\n📋 Daily Report Summary');
    console.log('=======================');
    console.log(`Date: ${report.date}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    console.log('\n📊 Key Metrics:');
    console.log(`Total Jobs: ${report.summary.totalJobs.toLocaleString()}`);
    console.log(`Active Jobs: ${report.summary.activeJobs.toLocaleString()}`);
    console.log(`Total Users: ${report.summary.totalUsers.toLocaleString()}`);
    console.log(`Active Users: ${report.summary.activeUsers.toLocaleString()}`);
    console.log(`Total Companies: ${report.summary.totalCompanies.toLocaleString()}`);
    console.log(`Total Applications: ${report.summary.totalApplications.toLocaleString()}`);

    console.log('\n📈 Today\'s Activity:');
    console.log(`New Jobs: ${report.summary.newJobsToday.toLocaleString()}`);
    console.log(`New Users: ${report.summary.newUsersToday.toLocaleString()}`);
    console.log(`New Applications: ${report.summary.newApplicationsToday.toLocaleString()}`);

    console.log('\n🏢 Top Companies:');
    report.topCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - ${company.jobCount} jobs, ${company.applicationCount} applications`);
    });

    console.log('\n💼 Top Job Titles:');
    report.topJobTitles.slice(0, 5).forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.count} jobs, ${job.applications} applications`);
    });

    console.log('\n📍 Top Locations:');
    report.locationStats.slice(0, 5).forEach((location, index) => {
      console.log(`${index + 1}. ${location.location} - ${location.jobCount} jobs, ${location.userCount} users`);
    });

    console.log('\n🔧 System Health:');
    console.log(`Database: ${report.systemHealth.databaseConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`Last Job Sync: ${report.systemHealth.lastJobSync || 'Never'}`);
    console.log(`Errors Today: ${report.systemHealth.errorCount}`);
  }

  /**
   * Save report to file
   */
  public saveReport(report: DailyReport): void {
    const reportsDir = join(process.cwd(), 'logs', 'reports');
    const filename = `daily-report-${report.date}.json`;
    const filepath = join(reportsDir, filename);

    try {
      // Ensure reports directory exists
      const fs = require('fs');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Save report
      writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved to: ${filepath}`);
    } catch (error) {
      console.error('❌ Error saving report:', error);
    }
  }

  /**
   * Run the complete report generation
   */
  public async run(): Promise<void> {
    try {
      await this.initialize();
      const report = await this.generateReport();
      this.displayReport(report);
      this.saveReport(report);

      console.log('\n🎉 Daily report generated successfully!');
    } catch (error) {
      console.error('\n❌ Report generation failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const generator = new DailyReportGenerator();
  await generator.run();
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DailyReportGenerator };
