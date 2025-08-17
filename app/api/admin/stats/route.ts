import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

async function requireAdminAuth(request: NextRequest): Promise<{ user: AuthenticatedUser | null; response: NextResponse | null }> {
  const session = await getServerSession(authOptions as any);
  if (!session || typeof session !== 'object' || !session.user || typeof session.user !== 'object') {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const user = session.user as any;
  if (!user.email || user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 }) };
  }
  
  return { 
    user: {
      id: user.id || user.email,
      email: user.email,
      name: user.name,
      role: user.role
    }, 
    response: null 
  };
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAdminAuth(request);
  if (!user) return response!;

  try {
    // Fetch real-time statistics from database
    const [
      totalUsers,
      activeUsers,
      pendingVerifications,
      recentSignups,
      totalJobs,
      activeJobs,
      featuredJobs,
      urgentJobs,
      totalCompanies,
      verifiedCompanies,
      totalApplications,
      recentApplications,
      jobStats,
      userStats,
      applicationStats
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.count({ 
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      
      // Job statistics
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { isFeatured: true } }),
      prisma.job.count({ where: { isUrgent: true } }),
      
      // Company statistics
      prisma.company.count(),
      prisma.company.count({ where: { isVerified: true } }),
      
      // Application statistics
      prisma.application.count(),
      prisma.application.count({ 
        where: { 
          appliedAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      
      // Job type distribution
      prisma.job.groupBy({
        by: ['jobType'],
        _count: { id: true },
        where: { isActive: true }
      }),
      
      // User role distribution
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      
      // Application status distribution
      prisma.application.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    // Calculate additional metrics
    const totalViews = await prisma.job.aggregate({
      _sum: { views: true }
    });

    const totalSalaryRange = await prisma.job.aggregate({
      _avg: { 
        salaryMin: true, 
        salaryMax: true 
      },
      where: { 
        salaryMin: { not: null }, 
        salaryMax: { not: null } 
      }
    });

    // Format response
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        pendingVerifications,
        recentSignups,
        roleDistribution: Array.isArray(userStats) ? userStats.map((stat: any) => ({
          role: stat.role,
          count: stat._count.id
        })) : []
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        featured: featuredJobs,
        urgent: urgentJobs,
        totalViews: totalViews._sum.views || 0,
        typeDistribution: Array.isArray(jobStats) ? jobStats.map((stat: any) => ({
          type: stat.jobType || 'Unknown',
          count: stat._count.id
        })) : [],
        averageSalary: {
          min: totalSalaryRange._avg.salaryMin || 0,
          max: totalSalaryRange._avg.salaryMax || 0
        }
      },
      companies: {
        total: totalCompanies,
        verified: verifiedCompanies,
        unverified: totalCompanies - verifiedCompanies
      },
      applications: {
        total: totalApplications,
        recent: recentApplications,
        statusDistribution: Array.isArray(applicationStats) ? applicationStats.map((stat: any) => ({
          status: stat.status,
          count: stat._count.id
        })) : []
      },
      system: {
        totalDataSize: totalUsers + totalJobs + totalCompanies + totalApplications,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Admin statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin statistics'
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
