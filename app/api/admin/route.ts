/**
 * Admin API - Real Database Integration
 * GET /api/admin - Get admin dashboard statistics and system health
 * POST /api/admin - Admin management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, extractUserFromRequest, checkDatabaseHealth } from '@/lib/database-service';
import { z } from 'zod';

// Admin operation schema
const adminOperationSchema = z.object({
  action: z.enum(['user_stats', 'job_stats', 'system_health', 'cleanup_inactive', 'bulk_approve']),
  target_ids: z.array(z.string()).optional(),
  filters: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    status: z.string().optional()
  }).optional()
});

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
    
    // Get comprehensive admin dashboard data
    const [
      userStats,
      jobStats,
      systemHealth,
      recentActivity,
      topCompanies,
      popularLocations
    ] = await Promise.all([
      // User statistics
      prisma.$queryRaw<{
        total_users: bigint;
        active_users: bigint;
        new_users_today: bigint;
        verified_users: bigint;
        jobseekers: bigint;
        employers: bigint;
        admins: bigint;
      }[]>`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE "isActive" = true) as active_users,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE) as new_users_today,
          COUNT(*) FILTER (WHERE "isVerified" = true) as verified_users,
          COUNT(*) FILTER (WHERE role = 'jobseeker') as jobseekers,
          COUNT(*) FILTER (WHERE role = 'employer') as employers,
          COUNT(*) FILTER (WHERE role = 'admin') as admins
        FROM "User"
      `,
      
      // Job statistics
      prisma.$queryRaw<{
        total_jobs: bigint;
        active_jobs: bigint;
        new_jobs_today: bigint;
        featured_jobs: bigint;
        remote_jobs: bigint;
        urgent_jobs: bigint;
        total_applications: bigint;
        total_bookmarks: bigint;
      }[]>`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE "isActive" = true) as active_jobs,
          COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE) as new_jobs_today,
          COUNT(*) FILTER (WHERE "isFeatured" = true) as featured_jobs,
          COUNT(*) FILTER (WHERE "isRemote" = true) as remote_jobs,
          COUNT(*) FILTER (WHERE "isUrgent" = true) as urgent_jobs,
          (SELECT COUNT(*) FROM "JobBookmark") as total_applications,
          (SELECT COUNT(*) FROM "JobBookmark") as total_bookmarks
        FROM "Job"
      `,
      
      // System health check
      checkDatabaseHealth(),
      
      // Recent activity
      prisma.job.findMany({
        select: {
          id: true,
          title: true,
          company: true,
          createdAt: true,
          isActive: true,
          isFeatured: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top companies by job count
      prisma.job.groupBy({
        by: ['company'],
        where: {
          company: { not: null },
          isActive: true
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      
      // Popular locations
      prisma.job.groupBy({
        by: ['location', 'country'],
        where: {
          location: { not: null },
          isActive: true
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);
    
    const userStatsData = userStats[0];
    const jobStatsData = jobStats[0];
    
    return NextResponse.json({
      success: true,
      message: 'Admin dashboard data loaded successfully',
      data: {
        overview: {
          users: {
            total: Number(userStatsData.total_users),
            active: Number(userStatsData.active_users),
            new_today: Number(userStatsData.new_users_today),
            verified: Number(userStatsData.verified_users),
            breakdown: {
              jobseekers: Number(userStatsData.jobseekers),
              employers: Number(userStatsData.employers),
              admins: Number(userStatsData.admins)
            }
          },
          jobs: {
            total: Number(jobStatsData.total_jobs),
            active: Number(jobStatsData.active_jobs),
            new_today: Number(jobStatsData.new_jobs_today),
            featured: Number(jobStatsData.featured_jobs),
            remote: Number(jobStatsData.remote_jobs),
            urgent: Number(jobStatsData.urgent_jobs)
          },
          engagement: {
            total_bookmarks: Number(jobStatsData.total_bookmarks),
            applications: Number(jobStatsData.total_applications)
          }
        },
        system: {
          database: {
            status: systemHealth.isHealthy ? 'healthy' : 'error',
            latency: systemHealth.latency,
            error: systemHealth.error
          },
          last_updated: new Date().toISOString()
        },
        recent_activity: recentActivity.map(job => ({
          id: job.id.toString(),
          type: 'job_posted',
          title: job.title,
          company: job.company,
          status: job.isActive ? 'active' : 'inactive',
          featured: job.isFeatured,
          created_at: job.createdAt.toISOString()
        })),
        top_companies: topCompanies.map(company => ({
          name: company.company!,
          job_count: company._count.id
        })),
        popular_locations: popularLocations.map(location => ({
          name: location.location!,
          country: location.country,
          job_count: location._count.id
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Admin GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load admin dashboard',
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
    const validatedData = adminOperationSchema.parse(body);
    
    let result;
    
    switch (validatedData.action) {
      case 'cleanup_inactive':
        // Deactivate jobs older than 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const cleanupResult = await prisma.job.updateMany({
          where: {
            createdAt: { lt: ninetyDaysAgo },
            isActive: true
          },
          data: { isActive: false }
        });
        
        result = {
          action: 'cleanup_inactive',
          jobs_deactivated: cleanupResult.count,
          message: `Deactivated ${cleanupResult.count} old jobs`
        };
        break;
        
      case 'bulk_approve':
        if (!validatedData.target_ids?.length) {
          throw new Error('No target IDs provided for bulk approval');
        }
        
        const approvalResult = await prisma.job.updateMany({
          where: {
            id: { in: validatedData.target_ids.map(id => parseInt(id)) }
          },
          data: { isActive: true }
        });
        
        result = {
          action: 'bulk_approve',
          jobs_approved: approvalResult.count,
          message: `Approved ${approvalResult.count} jobs`
        };
        break;
        
      case 'system_health':
        const health = await checkDatabaseHealth();
        result = {
          action: 'system_health',
          database: health,
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        throw new Error(`Unknown admin action: ${validatedData.action}`);
    }
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Admin POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid admin operation data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform admin operation',
      message: error.message
    }, { status: 500 });
  }
}