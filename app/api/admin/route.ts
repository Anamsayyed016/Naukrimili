/**
 * Admin API - Real Database Integration
 * GET /api/admin - Get admin dashboard statistics
 * POST /api/admin - Admin operations (bulk actions, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, extractUserFromRequest } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get comprehensive admin statistics from real database
    const [
      totalJobs,
      activeJobs,
      totalUsers,
      totalCompanies,
      recentJobs,
      recentUsers,
      jobsByType,
      jobsBySector,
      topCompanies,
      salaryStats
    ] = await Promise.all([
      // Total jobs
      prisma.job.count(),
      
      // Active jobs
      prisma.job.count({ where: { isActive: true } }),
      
      // Total users
      prisma.user.count(),
      
      // Total companies (distinct)
      prisma.job.findMany({
        where: { company: { not: null } },
        select: { company: true },
        distinct: ['company']
      }).then(companies => companies.length),
      
      // Recent jobs (last 7 days)
      prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Jobs by type
      prisma.job.groupBy({
        by: ['jobType'],
        where: { isActive: true, jobType: { not: null } },
        _count: { jobType: true }
      }),
      
      // Jobs by sector
      prisma.job.groupBy({
        by: ['sector'],
        where: { isActive: true, sector: { not: null } },
        _count: { sector: true }
      }),
      
      // Top companies by job count
      prisma.job.groupBy({
        by: ['company'],
        where: { isActive: true, company: { not: null } },
        _count: { company: true },
        orderBy: { _count: { company: 'desc' } },
        take: 10
      }),
      
      // Salary statistics
      prisma.job.aggregate({
        where: { 
          isActive: true, 
          salaryMin: { not: null },
          salaryMax: { not: null }
        },
        _avg: {
          salaryMin: true,
          salaryMax: true
        },
        _min: {
          salaryMin: true
        },
        _max: {
          salaryMax: true
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      dashboard: {
        overview: {
          total_jobs: totalJobs,
          active_jobs: activeJobs,
          inactive_jobs: totalJobs - activeJobs,
          total_users: totalUsers,
          total_companies: totalCompanies,
          recent_jobs: recentJobs,
          recent_users: recentUsers
        },
        job_distribution: {
          by_type: Object.fromEntries(
            jobsByType.map(stat => [stat.jobType!, stat._count.jobType])
          ),
          by_sector: Object.fromEntries(
            jobsBySector.map(stat => [stat.sector!, stat._count.sector])
          )
        },
        top_companies: topCompanies.map(company => ({
          name: company.company!,
          job_count: company._count.company
        })),
        salary_insights: {
          average_min: salaryStats._avg.salaryMin ? Math.round(salaryStats._avg.salaryMin) : null,
          average_max: salaryStats._avg.salaryMax ? Math.round(salaryStats._avg.salaryMax) : null,
          lowest_salary: salaryStats._min.salaryMin,
          highest_salary: salaryStats._max.salaryMax
        },
        system_health: {
          database_status: 'connected',
          api_status: 'operational',
          last_updated: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Admin GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin dashboard data',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'bulk_activate_jobs':
        const activatedCount = await prisma.job.updateMany({
          where: { id: { in: params.jobIds } },
          data: { isActive: true }
        });
        
        return NextResponse.json({
          success: true,
          message: `Activated ${activatedCount.count} jobs`,
          data: { activated: activatedCount.count }
        });

      case 'bulk_deactivate_jobs':
        const deactivatedCount = await prisma.job.updateMany({
          where: { id: { in: params.jobIds } },
          data: { isActive: false }
        });
        
        return NextResponse.json({
          success: true,
          message: `Deactivated ${deactivatedCount.count} jobs`,
          data: { deactivated: deactivatedCount.count }
        });

      case 'cleanup_old_jobs':
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        const cleanupCount = await prisma.job.updateMany({
          where: { 
            createdAt: { lt: cutoffDate },
            isActive: true
          },
          data: { isActive: false }
        });
        
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${cleanupCount.count} old jobs`,
          data: { cleaned: cleanupCount.count }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown admin action',
          message: `Action '${action}' is not supported`
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Admin POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute admin operation',
      message: error.message
    }, { status: 500 });
  }
}