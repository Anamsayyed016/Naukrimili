/**
 * Resume View Tracker Service
 * Tracks when employers/admins view jobseeker resumes and sends notifications
 */

import { prisma } from '@/lib/prisma';

export interface ResumeViewData {
  resumeId: string;
  viewerId: string;
  viewerType: 'employer' | 'admin' | 'other';
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResumeViewStats {
  totalViews: number;
  uniqueViewers: number;
  employerViews: number;
  adminViews: number;
  recentViews: Array<{
    viewerName: string;
    viewerType: string;
    companyName?: string;
    viewedAt: Date;
  }>;
}

/**
 * Track a resume view and send notification to jobseeker
 */
export async function trackResumeView(viewData: ResumeViewData): Promise<void> {
  try {
    console.log(`📊 Tracking resume view: ${viewData.resumeId} by ${viewData.viewerType} ${viewData.viewerId}`);

    // Get resume and owner information
    const resume = await prisma.resume.findUnique({
      where: { id: viewData.resumeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!resume) {
      console.error(`❌ Resume not found: ${viewData.resumeId}`);
      return;
    }

    // Get viewer information
    const viewer = await prisma.user.findUnique({
      where: { id: viewData.viewerId },
      include: {
        companyRelation: viewData.companyId ? {
          select: {
            id: true,
            name: true
          }
        } : false
      }
    });

    if (!viewer) {
      console.error(`❌ Viewer not found: ${viewData.viewerId}`);
      return;
    }

    // Check if this is a new view (prevent spam)
    const recentView = await prisma.resumeView.findFirst({
      where: {
        resumeId: viewData.resumeId,
        viewerId: viewData.viewerId,
        viewedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentView) {
      console.log(`⏭️ Skipping duplicate view from ${viewData.viewerId} within last hour`);
      return;
    }

    // Create resume view record
    const resumeView = await prisma.resumeView.create({
      data: {
        resumeId: viewData.resumeId,
        viewerId: viewData.viewerId,
        viewerType: viewData.viewerType,
        companyId: viewData.companyId,
        ipAddress: viewData.ipAddress,
        userAgent: viewData.userAgent
      }
    });

    console.log(`✅ Resume view tracked: ${resumeView.id}`);

    // Send notification to jobseeker (only for employer/admin views)
    if (viewData.viewerType === 'employer' || viewData.viewerType === 'admin') {
      await sendResumeViewNotification(resume, viewer, viewData.viewerType);
    }

  } catch (error) {
    console.error('❌ Error tracking resume view:', error);
    // Don't throw error to avoid breaking the viewing experience
  }
}

/**
 * Send notification to jobseeker about resume view
 */
async function sendResumeViewNotification(
  resume: any,
  viewer: any,
  viewerType: string
): Promise<void> {
  try {
    const viewerName = viewer.name || viewer.email;
    const companyName = viewer.companyRelation?.name || 'Unknown Company';
    
    let notificationTitle = '';
    let notificationMessage = '';

    if (viewerType === 'employer') {
      notificationTitle = '👀 Your Resume Was Viewed!';
      notificationMessage = `Great news! ${viewerName} from ${companyName} viewed your resume "${resume.fileName}". This could be the start of something great!`;
    } else if (viewerType === 'admin') {
      notificationTitle = '👀 Admin Viewed Your Resume';
      notificationMessage = `An admin viewed your resume "${resume.fileName}". This might be for verification or support purposes.`;
    }

    // Create notification
    await createNotification({
      userId: resume.user.id,
      type: 'RESUME_VIEWED',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        resumeId: resume.id,
        resumeName: resume.fileName,
        viewerId: viewer.id,
        viewerName,
        viewerType,
        companyName: viewer.companyRelation?.name,
        viewedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Resume view notification sent to jobseeker: ${resume.user.email}`);

  } catch (error) {
    console.error('❌ Error sending resume view notification:', error);
    // Don't throw error to avoid breaking the viewing experience
  }
}

/**
 * Get resume view statistics
 */
export async function getResumeViewStats(resumeId: string): Promise<ResumeViewStats> {
  try {
    const [totalViews, uniqueViewers, viewBreakdown, recentViews] = await Promise.all([
      // Total views
      prisma.resumeView.count({
        where: { resumeId }
      }),

      // Unique viewers
      prisma.resumeView.groupBy({
        by: ['viewerId'],
        where: { resumeId }
      }).then(result => result.length),

      // View breakdown by type
      prisma.resumeView.groupBy({
        by: ['viewerType'],
        where: { resumeId },
        _count: {
          id: true
        }
      }),

      // Recent views (last 10)
      prisma.resumeView.findMany({
        where: { resumeId },
        include: {
          viewer: {
            select: {
              name: true,
              email: true
            }
          },
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: { viewedAt: 'desc' },
        take: 10
      })
    ]);

    // Process view breakdown
    const employerViews = viewBreakdown.find(v => v.viewerType === 'employer')?._count.id || 0;
    const adminViews = viewBreakdown.find(v => v.viewerType === 'admin')?._count.id || 0;

    // Process recent views
    const processedRecentViews = recentViews.map(view => ({
      viewerName: view.viewer.name || view.viewer.email,
      viewerType: view.viewerType,
      companyName: view.company?.name,
      viewedAt: view.viewedAt
    }));

    return {
      totalViews,
      uniqueViewers,
      employerViews,
      adminViews,
      recentViews: processedRecentViews
    };

  } catch (error) {
    console.error('❌ Error getting resume view stats:', error);
    throw error;
  }
}

/**
 * Get all resume views for a user (jobseeker)
 */
export async function getUserResumeViews(userId: string): Promise<any[]> {
  try {
    const views = await prisma.resumeView.findMany({
      where: {
        resume: {
          userId: userId
        }
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true
          }
        },
        viewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: 50
    });

    return views;

  } catch (error) {
    console.error('❌ Error getting user resume views:', error);
    throw error;
  }
}
