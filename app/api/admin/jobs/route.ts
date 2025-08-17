import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { z } from 'zod';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

const jobActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'feature', 'unfeature', 'activate', 'deactivate', 'delete']),
  jobIds: z.array(z.number().int().positive()),
  reason: z.string().optional()
});

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'all', 'pending', 'active', 'inactive', 'flagged'
    const company = searchParams.get('company');
    const location = searchParams.get('location');
    const jobType = searchParams.get('jobType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      switch (status) {
        case 'pending':
          where.isActive = false;
          break;
        case 'active':
          where.isActive = true;
          break;
        case 'inactive':
          where.isActive = false;
          break;
        case 'flagged':
          where.isActive = false; // You can add a flagged field to your schema
          break;
      }
    }
    
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    if (jobType) {
      where.jobType = jobType;
    }

    // Get jobs with pagination and related data
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              industry: true,
              isVerified: true
            }
          },
          creator: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              applications: true,
              bookmarks: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    // Transform jobs for admin view
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company || job.companyRelation?.name,
      companyLogo: job.companyLogo || job.companyRelation?.logo,
      location: job.location,
      country: job.country,
      salary: job.salary,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      isActive: job.isActive,
      sector: job.sector,
      views: job.views,
      applicationsCount: job.applicationsCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      companyVerified: job.companyRelation?.isVerified || false,
      companyIndustry: job.companyRelation?.industry,
      creator: job.creator,
      stats: {
        applications: job._count.applications,
        bookmarks: job._count.bookmarks
      }
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      message: 'Jobs retrieved successfully'
    });

  } catch (error) {
    console.error('Admin jobs GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAdminAuth(request);
  if (!user) return response!;

  try {
    const body = await request.json();
    const { action, jobIds, reason } = jobActionSchema.parse(body);

    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No job IDs provided'
      }, { status: 400 });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'approve':
        updateData = { isActive: true };
        message = 'Jobs approved successfully';
        break;
      case 'reject':
        updateData = { isActive: false };
        message = 'Jobs rejected successfully';
        break;
      case 'feature':
        updateData = { isFeatured: true };
        message = 'Jobs featured successfully';
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        message = 'Jobs unfeatured successfully';
        break;
      case 'activate':
        updateData = { isActive: true };
        message = 'Jobs activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Jobs deactivated successfully';
        break;
      case 'delete':
        // Delete jobs (be careful with this!)
        await prisma.job.deleteMany({
          where: { id: { in: jobIds } }
        });
        message = 'Jobs deleted successfully';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    if (action !== 'delete') {
      // Update jobs
      await prisma.job.updateMany({
        where: { id: { in: jobIds } },
        data: updateData
      });
    }

    // Log admin action
    const adminAction = {
      adminId: user.id,
      action,
      targetType: 'job',
      targetIds: jobIds,
      reason,
      timestamp: new Date()
    };

    // You can store this in a separate admin_actions table if needed
    console.log('Admin action:', adminAction);

    return NextResponse.json({
      success: true,
      message,
      data: {
        action,
        affectedJobs: jobIds.length,
        reason
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Admin jobs POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process job action'
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
