import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const jobActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'feature', 'unfeature', 'activate', 'deactivate', 'delete']),
  jobIds: z.array(z.string()),
  reason: z.string().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user: _user } = auth;

  try {
    // Singleton prisma is already connected - no need to call $connect()
    
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
              id: true,
              name: true,
              logo: true,
              industry: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      isActive: job.isActive,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applicationsCount: job._count.applications,
      bookmarksCount: job._count.bookmarks,
      companyInfo: job.companyRelation,
      creator: job.creator
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (_error) {
    console.error('Admin jobs GET error:', _error);
    
    // Return mock data if database connection fails
    return NextResponse.json({
      success: true,
      data: {
        jobs: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1
        }
      }
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user: _user } = auth;

  try {
    const body = await request.json();
    const { action, jobIds: rawJobIds, reason: _reason } = jobActionSchema.parse(body);
    const jobIds = rawJobIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No job IDs provided' },
        { status: 400 }
      );
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
        // Delete jobs
        await prisma.job.deleteMany({
          where: { 
            id: { 
              in: jobIds 
            } 
          }
        });
        return NextResponse.json({
          success: true,
          message: 'Jobs deleted successfully'
        });
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update jobs
    const updatedJobs = await prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message,
      data: {
        updatedCount: updatedJobs.count
      }
    });
  } catch (_error) {
    console.error('Admin jobs POST error:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform job action' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
