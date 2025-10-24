#!/usr/bin/env node

/**
 * Analytics Backfill Script
 * Backfills analytics events from existing data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillAnalyticsEvents() {
  console.log('🔄 Starting analytics backfill...');
  
  try {
    // Backfill job views from existing job data
    console.log('📊 Backfilling job views...');
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      select: { id: true, title: true, company: true, views: true }
    });

    for (const job of jobs) {
      if (job.views > 0) {
        // Create synthetic job view events
        const events = Array.from({ length: Math.min(job.views, 10) }, (_, i) => ({
          eventId: `backfill-job-view-${job.id}-${i}`,
          userId: null,
          userRole: null,
          eventType: 'job_view',
          entityType: 'job',
          entityId: job.id.toString(),
          metadata: {
            jobTitle: job.title,
            company: job.company,
            backfilled: true
          },
          ipAddress: null,
          userAgent: null,
          sessionId: null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
        }));

        await prisma.analyticsEvent.createMany({
          data: events,
          skipDuplicates: true
        });
      }
    }

    // Backfill job applications
    console.log('📊 Backfilling job applications...');
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        userId: true,
        jobId: true,
        appliedAt: true,
        job: {
          select: { title: true, company: true }
        },
        user: {
          select: { role: true }
        }
      }
    });

    for (const application of applications) {
      await prisma.analyticsEvent.create({
        data: {
          eventId: `backfill-application-${application.id}`,
          userId: application.userId,
          userRole: application.user?.role || 'jobseeker',
          eventType: 'job_application',
          entityType: 'application',
          entityId: application.id,
          metadata: {
            jobId: application.jobId.toString(),
            jobTitle: application.job?.title || 'Unknown Job',
            company: application.job?.company || 'Unknown Company',
            backfilled: true
          },
          ipAddress: null,
          userAgent: null,
          sessionId: application.userId,
          createdAt: application.appliedAt
        }
      });
    }

    // Backfill job bookmarks
    console.log('📊 Backfilling job bookmarks...');
    const bookmarks = await prisma.jobBookmark.findMany({
      select: {
        id: true,
        userId: true,
        jobId: true,
        createdAt: true,
        job: {
          select: { title: true, company: true }
        },
        user: {
          select: { role: true }
        }
      }
    });

    for (const bookmark of bookmarks) {
      await prisma.analyticsEvent.create({
        data: {
          eventId: `backfill-bookmark-${bookmark.id}`,
          userId: bookmark.userId,
          userRole: bookmark.user?.role || 'jobseeker',
          eventType: 'job_bookmark',
          entityType: 'job',
          entityId: bookmark.jobId.toString(),
          metadata: {
            jobTitle: bookmark.job?.title || 'Unknown Job',
            company: bookmark.job?.company || 'Unknown Company',
            action: 'bookmark',
            backfilled: true
          },
          ipAddress: null,
          userAgent: null,
          sessionId: bookmark.userId,
          createdAt: bookmark.createdAt
        }
      });
    }

    // Backfill search history
    console.log('📊 Backfilling search history...');
    const searches = await prisma.searchHistory.findMany({
      select: {
        id: true,
        userId: true,
        query: true,
        location: true,
        createdAt: true,
        user: {
          select: { role: true }
        }
      }
    });

    for (const search of searches) {
      await prisma.analyticsEvent.create({
        data: {
          eventId: `backfill-search-${search.id}`,
          userId: search.userId,
          userRole: search.user?.role || 'jobseeker',
          eventType: 'job_search',
          entityType: 'search',
          entityId: search.id,
          metadata: {
            query: search.query,
            location: search.location,
            backfilled: true
          },
          ipAddress: null,
          userAgent: null,
          sessionId: search.userId,
          createdAt: search.createdAt
        }
      });
    }

    console.log('✅ Analytics backfill completed successfully!');

  } catch (error) {
    console.error('❌ Analytics backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillAnalyticsEvents();
