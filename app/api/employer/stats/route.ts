import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/employer/stats
 * Returns stats ONLY for the authenticated employer's company
 * NOT system-wide stats (which should only be visible to admins)
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Fetching employer-specific stats...');
    
    // Authenticate and get employer's company
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      console.log('❌ Employer auth failed:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const companyId = user.company.id;
    console.log(`👤 Fetching stats for company: ${user.company.name} (${companyId})`);
    
    // Fetch ONLY this employer's company stats
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      applicationStatusBreakdown
    ] = await Promise.all([
      // Count jobs posted by THIS company
      prisma.job.count({
        where: { companyId }
      }),
      // Count active jobs for THIS company
      prisma.job.count({
        where: { companyId, isActive: true }
      }),
      // Count applications to THIS company's jobs
      prisma.application.count({
        where: { companyId }
      }),
      // Count pending applications for THIS company
      prisma.application.count({
        where: { 
          companyId,
          status: { in: ['pending', 'submitted'] }
        }
      }),
      // Get application status breakdown for THIS company
      prisma.application.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true }
      })
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      profileViews: 0, // TODO: Implement company profile views tracking
      companyRating: 0, // TODO: Implement company rating system
      applicationStatusDistribution: applicationStatusBreakdown.map(item => ({
        status: item.status,
        _count: { status: item._count.id }
      }))
    };

    console.log(`✅ Employer stats fetched for company ${companyId}:`, {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching employer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer stats' },
      { status: 500 }
    );
  }
}

