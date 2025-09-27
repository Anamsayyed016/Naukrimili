/**
 * Comprehensive Job Automation System
 * Integrates 3rd party jobs, employer posted jobs, and unified workflow
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from '@/lib/jobs/providers';
import { getSocketService } from '@/lib/socket-server';
import { createNotification } from '@/lib/notification-service';

export interface AutomationConfig {
  // 3rd Party Integration
  enableAdzuna: boolean;
  enableJSearch: boolean;
  enableGoogleJobs: boolean;
  enableJooble: boolean;
  
  // Employer Integration
  enableEmployerPosting: boolean;
  enableAutoApproval: boolean;
  enableEmployerNotifications: boolean;
  
  // Workflow Automation
  enableAutoCategorization: boolean;
  enableDuplicateDetection: boolean;
  enableQualityScoring: boolean;
  enableAutoExpiry: boolean;
  
  // Sync Settings
  syncInterval: number; // minutes
  maxJobsPerSync: number;
  enableRealTimeSync: boolean;
  
  // Quality Control
  minQualityScore: number;
  enableSpamDetection: boolean;
  enableContentModeration: boolean;
}

export interface JobSource {
  id: string;
  name: string;
  type: 'external' | 'employer' | 'manual';
  priority: number;
  enabled: boolean;
  lastSync: Date | null;
  totalJobs: number;
  activeJobs: number;
}

export interface AutomationStats {
  totalJobs: number;
  externalJobs: number;
  employerJobs: number;
  manualJobs: number;
  activeJobs: number;
  expiredJobs: number;
  qualityScore: number;
  lastSync: Date;
  syncDuration: number;
  errors: string[];
}

export class JobAutomationSystem {
  private config: AutomationConfig;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AutomationConfig> = {}) {
    this.config = {
      enableAdzuna: true,
      enableJSearch: true,
      enableGoogleJobs: true,
      enableJooble: true,
      enableEmployerPosting: true,
      enableAutoApproval: true,
      enableEmployerNotifications: true,
      enableAutoCategorization: true,
      enableDuplicateDetection: true,
      enableQualityScoring: true,
      enableAutoExpiry: true,
      syncInterval: 30, // 30 minutes
      maxJobsPerSync: 1000,
      enableRealTimeSync: true,
      minQualityScore: 0.6,
      enableSpamDetection: true,
      enableContentModeration: true,
      ...config
    };
  }

  /**
   * Start the automation system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Automation system is already running');
      return;
    }

    console.log('🚀 Starting Job Automation System...');
    this.isRunning = true;

    // Initial sync
    await this.performFullSync();

    // Set up periodic sync
    if (this.config.syncInterval > 0) {
      this.syncInterval = setInterval(
        () => this.performFullSync(),
        this.config.syncInterval * 60 * 1000
      );
      console.log(`⏰ Scheduled sync every ${this.config.syncInterval} minutes`);
    }

    // Set up real-time sync for employer jobs
    if (this.config.enableRealTimeSync) {
      await this.setupRealTimeSync();
    }

    console.log('✅ Job Automation System started successfully');
  }

  /**
   * Stop the automation system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Automation system is not running');
      return;
    }

    console.log('🛑 Stopping Job Automation System...');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('✅ Job Automation System stopped');
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(): Promise<AutomationStats> {
    const startTime = Date.now();
    console.log('🔄 Starting full job synchronization...');

    const stats: AutomationStats = {
      totalJobs: 0,
      externalJobs: 0,
      employerJobs: 0,
      manualJobs: 0,
      activeJobs: 0,
      expiredJobs: 0,
      qualityScore: 0,
      lastSync: new Date(),
      syncDuration: 0,
      errors: []
    };

    try {
      // 1. Mark expired jobs as inactive
      if (this.config.enableAutoExpiry) {
        stats.expiredJobs = await this.markExpiredJobsInactive();
      }

      // 2. Sync external jobs
      if (this.config.enableAdzuna || this.config.enableJSearch || 
          this.config.enableGoogleJobs || this.config.enableJooble) {
        const externalStats = await this.syncExternalJobs();
        stats.externalJobs = externalStats.total;
        stats.errors.push(...externalStats.errors);
      }

      // 3. Process employer jobs
      if (this.config.enableEmployerPosting) {
        const employerStats = await this.processEmployerJobs();
        stats.employerJobs = employerStats.total;
        stats.errors.push(...employerStats.errors);
      }

      // 4. Quality control and categorization
      if (this.config.enableAutoCategorization || this.config.enableQualityScoring) {
        await this.performQualityControl();
      }

      // 5. Calculate final statistics
      const finalStats = await this.calculateStats();
      Object.assign(stats, finalStats);

      stats.syncDuration = Date.now() - startTime;
      console.log(`✅ Full sync completed in ${stats.syncDuration}ms`);

      // 6. Send notifications
      if (this.config.enableEmployerNotifications) {
        await this.sendSyncNotifications(stats);
      }

      return stats;

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      stats.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      stats.syncDuration = Date.now() - startTime;
      return stats;
    }
  }

  /**
   * Sync external jobs from 3rd party APIs
   */
  private async syncExternalJobs(): Promise<{ total: number; errors: string[] }> {
    const errors: string[] = [];
    let totalJobs = 0;

    console.log('🌐 Syncing external jobs...');

    const syncPromises = [];

    if (this.config.enableAdzuna) {
      syncPromises.push(
        this.syncFromAdzuna().catch(err => {
          errors.push(`Adzuna sync failed: ${err.message}`);
          return 0;
        })
      );
    }

    if (this.config.enableJSearch) {
      syncPromises.push(
        this.syncFromJSearch().catch(err => {
          errors.push(`JSearch sync failed: ${err.message}`);
          return 0;
        })
      );
    }

    if (this.config.enableGoogleJobs) {
      syncPromises.push(
        this.syncFromGoogleJobs().catch(err => {
          errors.push(`Google Jobs sync failed: ${err.message}`);
          return 0;
        })
      );
    }

    if (this.config.enableJooble) {
      syncPromises.push(
        this.syncFromJooble().catch(err => {
          errors.push(`Jooble sync failed: ${err.message}`);
          return 0;
        })
      );
    }

    const results = await Promise.all(syncPromises);
    totalJobs = results.reduce((sum, count) => sum + count, 0);

    console.log(`✅ External sync completed: ${totalJobs} jobs processed`);
    return { total: totalJobs, errors };
  }

  /**
   * Sync jobs from Adzuna
   */
  private async syncFromAdzuna(): Promise<number> {
    console.log('📡 Syncing from Adzuna...');
    
    const jobs = await fetchFromAdzuna('software engineer', 'IN', 1, {
      location: 'India',
      distanceKm: 100
    });

    return await this.processExternalJobs(jobs, 'adzuna');
  }

  /**
   * Sync jobs from JSearch
   */
  private async syncFromJSearch(): Promise<number> {
    console.log('📡 Syncing from JSearch...');
    
    const jobs = await fetchFromJSearch('developer', 'IN', 1);

    return await this.processExternalJobs(jobs, 'jsearch');
  }

  /**
   * Sync jobs from Google Jobs
   */
  private async syncFromGoogleJobs(): Promise<number> {
    console.log('📡 Syncing from Google Jobs...');
    
    const jobs = await fetchFromGoogleJobs('software engineer', 'IN', 1);

    return await this.processExternalJobs(jobs, 'google');
  }

  /**
   * Sync jobs from Jooble
   */
  private async syncFromJooble(): Promise<number> {
    console.log('📡 Syncing from Jooble...');
    
    const jobs = await fetchFromJooble('developer', 'IN', 1);

    return await this.processExternalJobs(jobs, 'jooble');
  }

  /**
   * Process external jobs and store in database
   */
  private async processExternalJobs(jobs: any[], source: string): Promise<number> {
    let processed = 0;

    for (const jobData of jobs) {
      try {
        // Check for duplicates
        if (this.config.enableDuplicateDetection) {
          const existing = await this.findDuplicateJob(jobData);
          if (existing) {
            // Update existing job
            await this.updateExistingJob(existing.id, jobData);
            continue;
          }
        }

        // Quality scoring
        if (this.config.enableQualityScoring) {
          const qualityScore = await this.calculateQualityScore(jobData);
          if (qualityScore < this.config.minQualityScore) {
            console.log(`⚠️ Job rejected due to low quality score: ${qualityScore}`);
            continue;
          }
          jobData.qualityScore = qualityScore;
        }

        // Auto categorization
        if (this.config.enableAutoCategorization) {
          jobData.sector = await this.categorizeJob(jobData);
        }

        // Create job
        await prisma.job.create({
          data: {
            source: source,
            sourceId: jobData.id || `ext-${Date.now()}-${Math.random()}`,
            title: jobData.title,
            company: jobData.company,
            location: jobData.location,
            country: jobData.country || 'IN',
            description: jobData.description,
            requirements: JSON.stringify(jobData.requirements || []),
            applyUrl: jobData.applyUrl,
            salary: jobData.salary,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            salaryCurrency: jobData.salaryCurrency || 'INR',
            jobType: jobData.jobType,
            experienceLevel: jobData.experienceLevel,
            skills: JSON.stringify(jobData.skills || []),
            isRemote: jobData.isRemote || false,
            isHybrid: jobData.isHybrid || false,
            isUrgent: jobData.isUrgent || false,
            isFeatured: jobData.isFeatured || false,
            sector: jobData.sector,
            isActive: true,
            rawJson: {
              ...jobData,
              source: source,
              syncedAt: new Date().toISOString(),
              qualityScore: jobData.qualityScore
            }
          }
        });

        processed++;
      } catch (error) {
        console.error(`❌ Failed to process job from ${source}:`, error);
      }
    }

    return processed;
  }

  /**
   * Process employer posted jobs
   */
  private async processEmployerJobs(): Promise<{ total: number; errors: string[] }> {
    const errors: string[] = [];
    let totalJobs = 0;

    console.log('👔 Processing employer jobs...');

    try {
      // Get pending employer jobs
      const pendingJobs = await prisma.job.findMany({
        where: {
          source: 'manual',
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      for (const job of pendingJobs) {
        try {
          // Auto approval if enabled
          if (this.config.enableAutoApproval) {
            await this.autoApproveJob(job);
          }

          // Quality scoring
          if (this.config.enableQualityScoring) {
            const qualityScore = await this.calculateQualityScore(job);
            await prisma.job.update({
              where: { id: job.id },
              data: {
                rawJson: {
                  ...job.rawJson as any,
                  qualityScore: qualityScore.toString()
                }
              }
            });
          }

          // Send notifications
          if (this.config.enableEmployerNotifications && job.creator) {
            await this.sendJobPostedNotification(job.creator.id, job);
          }

          totalJobs++;
        } catch (error) {
          console.error(`❌ Failed to process employer job ${job.id}:`, error);
          errors.push(`Employer job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`✅ Employer jobs processed: ${totalJobs}`);
      return { total: totalJobs, errors };

    } catch (error) {
      console.error('❌ Employer job processing failed:', error);
      errors.push(`Employer processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { total: 0, errors };
    }
  }

  /**
   * Find duplicate jobs
   */
  private async findDuplicateJob(jobData: any): Promise<any> {
    return await prisma.job.findFirst({
      where: {
        OR: [
          {
            title: { contains: jobData.title, mode: 'insensitive' },
            company: { contains: jobData.company, mode: 'insensitive' },
            location: { contains: jobData.location, mode: 'insensitive' }
          },
          {
            sourceId: jobData.id
          }
        ]
      }
    });
  }

  /**
   * Update existing job
   */
  private async updateExistingJob(jobId: number, jobData: any): Promise<void> {
    await prisma.job.update({
      where: { id: jobId as any },
      data: {
        title: jobData.title,
        description: jobData.description,
        salary: jobData.salary,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        isActive: true,
        updatedAt: new Date(),
        rawJson: {
          ...jobData,
          updatedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Calculate quality score for a job
   */
  private async calculateQualityScore(job: any): Promise<number> {
    let score = 0.5; // Base score

    // Title quality
    if (job.title && job.title.length > 10) score += 0.1;
    if (job.title && !job.title.includes('urgent') && !job.title.includes('immediate')) score += 0.1;

    // Description quality
    if (job.description && job.description.length > 100) score += 0.1;
    if (job.description && job.description.length > 500) score += 0.1;

    // Company information
    if (job.company && job.company.length > 2) score += 0.1;

    // Location information
    if (job.location && job.location.length > 2) score += 0.1;

    // Salary information
    if (job.salary || (job.salaryMin && job.salaryMax)) score += 0.1;

    // Skills information
    if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) score += 0.1;

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Auto categorize job
   */
  private async categorizeJob(job: any): Promise<string> {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const skills = Array.isArray(job.skills) ? job.skills.join(' ').toLowerCase() : '';

    const content = `${title} ${description} ${skills}`;

    if (content.includes('software') || content.includes('developer') || content.includes('programmer')) {
      return 'Technology';
    }
    if (content.includes('marketing') || content.includes('sales') || content.includes('advertising')) {
      return 'Marketing';
    }
    if (content.includes('finance') || content.includes('accounting') || content.includes('banking')) {
      return 'Finance';
    }
    if (content.includes('healthcare') || content.includes('medical') || content.includes('doctor')) {
      return 'Healthcare';
    }
    if (content.includes('education') || content.includes('teacher') || content.includes('professor')) {
      return 'Education';
    }

    return 'General';
  }

  /**
   * Auto approve job
   */
  private async autoApproveJob(job: any): Promise<void> {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        isActive: true,
        isFeatured: job.qualityScore > 0.8,
        rawJson: {
          ...job.rawJson as any,
          autoApproved: true,
          approvedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Mark expired jobs as inactive
   */
  private async markExpiredJobsInactive(): Promise<number> {
    const expiredJobs = await prisma.job.updateMany({
      where: {
        isActive: true,
        OR: [
          {
            expiryDate: {
              lt: new Date()
            }
          },
          {
            createdAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
            }
          }
        ]
      },
      data: {
        isActive: false
      }
    });

    console.log(`⏰ Marked ${expiredJobs.count} jobs as expired`);
    return expiredJobs.count;
  }

  /**
   * Perform quality control
   */
  private async performQualityControl(): Promise<void> {
    console.log('🔍 Performing quality control...');

    // Update quality scores for existing jobs
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      take: 100
    });

    for (const job of jobs) {
      const qualityScore = await this.calculateQualityScore(job);
        await prisma.job.update({
          where: { id: job.id },
          data: {
            rawJson: {
              ...job.rawJson as any,
              qualityScore: qualityScore.toString()
            }
          }
        });
    }

    console.log('✅ Quality control completed');
  }

  /**
   * Calculate system statistics
   */
  private async calculateStats(): Promise<Partial<AutomationStats>> {
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

    // Calculate average quality score
    const jobsWithScores = await prisma.job.findMany({
      where: {
        isActive: true,
        rawJson: {
          path: ['qualityScore'],
          not: null
        }
      },
      select: {
        rawJson: true
      }
    });

    const qualityScore = jobsWithScores.length > 0
      ? jobsWithScores.reduce((sum, job) => {
          const score = (job.rawJson as any)?.qualityScore || 0;
          return sum + score;
        }, 0) / jobsWithScores.length
      : 0;

    return {
      totalJobs,
      activeJobs,
      externalJobs,
      employerJobs,
      manualJobs,
      qualityScore
    };
  }

  /**
   * Send sync notifications
   */
  private async sendSyncNotifications(stats: AutomationStats): Promise<void> {
    try {
      const socketService = getSocketService();
      if (socketService) {
        await socketService.sendNotificationToRole('admin', {
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Job Sync Completed',
          message: `Synced ${stats.totalJobs} jobs (${stats.externalJobs} external, ${stats.employerJobs} employer)`,
          data: {
            stats,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to send sync notifications:', error);
    }
  }

  /**
   * Send job posted notification
   */
  private async sendJobPostedNotification(userId: string, job: any): Promise<void> {
    try {
      await createNotification({
        userId,
        type: 'JOB_CREATED',
        title: 'Job Posted Successfully',
        message: `Your job "${job.title}" has been posted and is now live`,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company
        }
      });

      const socketService = getSocketService();
      if (socketService) {
        await socketService.sendNotificationToUser(userId, {
          type: 'JOB_CREATED',
          title: 'Job Posted Successfully',
          message: `Your job "${job.title}" has been posted and is now live`,
          data: {
            jobId: job.id,
            jobTitle: job.title,
            company: job.company
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to send job posted notification:', error);
    }
  }

  /**
   * Setup real-time sync
   */
  private async setupRealTimeSync(): Promise<void> {
    console.log('⚡ Setting up real-time sync...');
    
    // This would integrate with your existing socket system
    // to listen for new employer job postings and sync them immediately
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    config: AutomationConfig;
    stats: AutomationStats;
    sources: JobSource[];
  }> {
    const stats = await this.calculateStats();
    const sources = await this.getJobSources();

    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: {
        totalJobs: 0,
        externalJobs: 0,
        employerJobs: 0,
        manualJobs: 0,
        activeJobs: 0,
        expiredJobs: 0,
        qualityScore: 0,
        lastSync: new Date(),
        syncDuration: 0,
        errors: [],
        ...stats
      },
      sources
    };
  }

  /**
   * Get job sources
   */
  private async getJobSources(): Promise<JobSource[]> {
    const sources = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    return sources.map(source => ({
      id: source.source,
      name: source.source.charAt(0).toUpperCase() + source.source.slice(1),
      type: source.source === 'manual' ? 'employer' : 'external',
      priority: source.source === 'manual' ? 1 : 2,
      enabled: true,
      lastSync: new Date(),
      totalJobs: source._count.id,
      activeJobs: source._count.id
    }));
  }
}

// Export singleton instance
export const jobAutomationSystem = new JobAutomationSystem();
