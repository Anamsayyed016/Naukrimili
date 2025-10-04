#!/usr/bin/env ts-node

/**
 * Clean Old Logs Cron Job
 * 
 * Cleans up expired logs, temporary data, and old records
 * Runs daily to maintain database performance and storage efficiency
 * 
 * Usage:
 *   npx ts-node scripts/cron-jobs/clean-old-logs.ts
 *   npx ts-node scripts/cron-jobs/clean-old-logs.ts --dry-run
 *   # Add to crontab: 0 2 * * * cd /path/to/project && npx ts-node scripts/cron-jobs/clean-old-logs.ts
 */

import { PrismaClient } from '@prisma/client';
import { EnvironmentManager } from '../setup-env';

interface CleanupConfig {
  dryRun: boolean;
  retentionDays: {
    mobileErrors: number;
    searchHistory: number;
    notifications: number;
    sessions: number;
    otpVerifications: number;
    analyticsEvents: number;
  };
}

interface CleanupResults {
  mobileErrors: number;
  searchHistory: number;
  notifications: number;
  sessions: number;
  otpVerifications: number;
  analyticsEvents: number;
  totalDeleted: number;
  totalSpaceSaved: number;
}

class LogCleanupService {
  private prisma: PrismaClient;
  private envManager: EnvironmentManager;
  private config: CleanupConfig;

  constructor() {
    this.prisma = new PrismaClient();
    this.envManager = new EnvironmentManager();
    this.config = {
      dryRun: process.argv.includes('--dry-run'),
      retentionDays: {
        mobileErrors: 30,      // Keep mobile errors for 30 days
        searchHistory: 90,     // Keep search history for 90 days
        notifications: 30,     // Keep notifications for 30 days
        sessions: 7,           // Keep sessions for 7 days
        otpVerifications: 1,   // Keep OTP verifications for 1 day
        analyticsEvents: 365   // Keep analytics events for 1 year
      }
    };
  }

  /**
   * Initialize the cleanup service
   */
  public async initialize(): Promise<void> {
    console.log('🧹 Log Cleanup Service');
    console.log('======================');

    await this.envManager.loadEnvironment();
    const envConfig = this.envManager.getEnvironmentConfig();

    console.log(`Environment: ${envConfig.nodeEnv}`);
    console.log(`Mode: ${this.config.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
    console.log(`Production: ${envConfig.isProduction ? '✅' : '❌'}`);

    if (envConfig.isProduction && !this.config.dryRun) {
      console.log('⚠️  Running cleanup on production environment');
    }
  }

  /**
   * Calculate cutoff date for retention period
   */
  private getCutoffDate(days: number): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff;
  }

  /**
   * Clean up mobile errors
   */
  private async cleanupMobileErrors(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.mobileErrors);
    
    console.log(`\n📱 Cleaning mobile errors older than ${this.config.retentionDays.mobileErrors} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.mobileError.count({
        where: {
          createdAt: {
            lt: cutoff
          }
        }
      });
      console.log(`   Would delete ${count} mobile error records`);
      return count;
    }

    const result = await this.prisma.mobileError.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });

    console.log(`   Deleted ${result.count} mobile error records`);
    return result.count;
  }

  /**
   * Clean up search history
   */
  private async cleanupSearchHistory(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.searchHistory);
    
    console.log(`\n🔍 Cleaning search history older than ${this.config.retentionDays.searchHistory} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.searchHistory.count({
        where: {
          createdAt: {
            lt: cutoff
          }
        }
      });
      console.log(`   Would delete ${count} search history records`);
      return count;
    }

    const result = await this.prisma.searchHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });

    console.log(`   Deleted ${result.count} search history records`);
    return result.count;
  }

  /**
   * Clean up old notifications
   */
  private async cleanupNotifications(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.notifications);
    
    console.log(`\n🔔 Cleaning notifications older than ${this.config.retentionDays.notifications} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.notification.count({
        where: {
          AND: [
            {
              createdAt: {
                lt: cutoff
              }
            },
            {
              isRead: true
            }
          ]
        }
      });
      console.log(`   Would delete ${count} read notification records`);
      return count;
    }

    // Only delete read notifications older than retention period
    const result = await this.prisma.notification.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lt: cutoff
            }
          },
          {
            isRead: true
          }
        ]
      }
    });

    console.log(`   Deleted ${result.count} read notification records`);
    return result.count;
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupSessions(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.sessions);
    
    console.log(`\n🔐 Cleaning sessions older than ${this.config.retentionDays.sessions} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.session.count({
        where: {
          OR: [
            {
              expires: {
                lt: new Date()
              }
            },
            {
              createdAt: {
                lt: cutoff
              }
            }
          ]
        }
      });
      console.log(`   Would delete ${count} session records`);
      return count;
    }

    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          {
            expires: {
              lt: new Date()
            }
          },
          {
            createdAt: {
              lt: cutoff
            }
          }
        ]
      }
    });

    console.log(`   Deleted ${result.count} session records`);
    return result.count;
  }

  /**
   * Clean up OTP verifications
   */
  private async cleanupOtpVerifications(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.otpVerifications);
    
    console.log(`\n📱 Cleaning OTP verifications older than ${this.config.retentionDays.otpVerifications} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.otpVerification.count({
        where: {
          createdAt: {
            lt: cutoff
          }
        }
      });
      console.log(`   Would delete ${count} OTP verification records`);
      return count;
    }

    const result = await this.prisma.otpVerification.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });

    console.log(`   Deleted ${result.count} OTP verification records`);
    return result.count;
  }

  /**
   * Clean up old analytics events
   */
  private async cleanupAnalyticsEvents(): Promise<number> {
    const cutoff = this.getCutoffDate(this.config.retentionDays.analyticsEvents);
    
    console.log(`\n📊 Cleaning analytics events older than ${this.config.retentionDays.analyticsEvents} days...`);
    
    if (this.config.dryRun) {
      const count = await this.prisma.analyticsEvent.count({
        where: {
          createdAt: {
            lt: cutoff
          }
        }
      });
      console.log(`   Would delete ${count} analytics event records`);
      return count;
    }

    const result = await this.prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });

    console.log(`   Deleted ${result.count} analytics event records`);
    return result.count;
  }

  /**
   * Clean up temporary files and logs
   */
  private async cleanupTempFiles(): Promise<void> {
    console.log('\n📁 Cleaning temporary files...');
    
    try {
      const { readdirSync, statSync, unlinkSync, existsSync } = await import('fs');
      const { join, extname } = await import('path');
      
      const tempDirs = [
        join(process.cwd(), 'logs'),
        join(process.cwd(), 'temp'),
        join(process.cwd(), 'uploads', 'temp')
      ];

      for (const dir of tempDirs) {
        if (existsSync(dir)) {
          const files = readdirSync(dir);
          const now = Date.now();
          const oneDayAgo = now - (24 * 60 * 60 * 1000);

          let deletedCount = 0;
          for (const file of files) {
            const filePath = join(dir, file);
            const stats = statSync(filePath);
            
            if (stats.isFile() && stats.mtime.getTime() < oneDayAgo) {
              if (!this.config.dryRun) {
                unlinkSync(filePath);
              }
              deletedCount++;
            }
          }
          
          console.log(`   ${this.config.dryRun ? 'Would delete' : 'Deleted'} ${deletedCount} files from ${dir}`);
        }
      }
    } catch (error) {
      console.warn('   Warning: Could not clean temp files:', error);
    }
  }

  /**
   * Run database maintenance
   */
  private async runDatabaseMaintenance(): Promise<void> {
    console.log('\n🔧 Running database maintenance...');
    
    if (this.config.dryRun) {
      console.log('   Would run VACUUM and ANALYZE on database');
      return;
    }

    try {
      // Run VACUUM to reclaim space
      await this.prisma.$executeRaw`VACUUM`;
      console.log('   ✅ VACUUM completed');
      
      // Run ANALYZE to update statistics
      await this.prisma.$executeRaw`ANALYZE`;
      console.log('   ✅ ANALYZE completed');
    } catch (error) {
      console.warn('   Warning: Database maintenance failed:', error);
    }
  }

  /**
   * Run the complete cleanup process
   */
  public async run(): Promise<void> {
    try {
      await this.initialize();

      const results: CleanupResults = {
        mobileErrors: 0,
        searchHistory: 0,
        notifications: 0,
        sessions: 0,
        otpVerifications: 0,
        analyticsEvents: 0,
        totalDeleted: 0,
        totalSpaceSaved: 0
      };

      // Clean up different types of data
      results.mobileErrors = await this.cleanupMobileErrors();
      results.searchHistory = await this.cleanupSearchHistory();
      results.notifications = await this.cleanupNotifications();
      results.sessions = await this.cleanupSessions();
      results.otpVerifications = await this.cleanupOtpVerifications();
      results.analyticsEvents = await this.cleanupAnalyticsEvents();

      // Clean up temporary files
      await this.cleanupTempFiles();

      // Run database maintenance
      await this.runDatabaseMaintenance();

      // Calculate totals
      results.totalDeleted = Object.values(results).reduce((sum, count) => 
        typeof count === 'number' ? sum + count : sum, 0
      );

      // Display summary
      this.displaySummary(results);

      console.log('\n🎉 Cleanup completed successfully!');

    } catch (error) {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Display cleanup summary
   */
  private displaySummary(results: CleanupResults): void {
    console.log('\n📊 Cleanup Summary');
    console.log('==================');
    console.log(`Mobile Errors: ${results.mobileErrors.toLocaleString()}`);
    console.log(`Search History: ${results.searchHistory.toLocaleString()}`);
    console.log(`Notifications: ${results.notifications.toLocaleString()}`);
    console.log(`Sessions: ${results.sessions.toLocaleString()}`);
    console.log(`OTP Verifications: ${results.otpVerifications.toLocaleString()}`);
    console.log(`Analytics Events: ${results.analyticsEvents.toLocaleString()}`);
    console.log(`Total Records: ${results.totalDeleted.toLocaleString()}`);
    
    if (this.config.dryRun) {
      console.log('\n⚠️  This was a dry run - no changes were made');
    }
  }
}

// Main execution
async function main() {
  const cleanup = new LogCleanupService();
  await cleanup.run();
}

// Run if called directly
if (require.main === module) {
  main();
}

export { LogCleanupService };
