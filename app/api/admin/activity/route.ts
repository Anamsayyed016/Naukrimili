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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type'); // 'all', 'users', 'jobs', 'companies', 'applications'
    const skip = (page - 1) * limit;

    let activities: any[] = [];
    let total = 0;

    if (!type || type === 'all') {
      // Get all recent activities
      const [userActivities, jobActivities, companyActivities, applicationActivities] = await Promise.all([
        // Recent user signups
        prisma.user.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            isVerified: true,
            isActive: true
          }
        }),
        
        // Recent job postings
        prisma.job.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            createdAt: true,
            isActive: true,
            isFeatured: true,
            createdBy: true
          }
        }),
        
        // Recent company registrations
        prisma.company.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            industry: true,
            location: true,
            createdAt: true,
            isVerified: true
          }
        }),
        
        // Recent applications
        prisma.application.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { appliedAt: 'desc' },
          select: {
            id: true,
            status: true,
            appliedAt: true,
            userId: true,
            jobId: true,
            job: {
              select: {
                title: true,
                company: true
              }
            },
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      ]);

      // Transform and combine activities
      activities = [
        ...userActivities.map(user => ({
          id: `user_${user.id}`,
          type: 'user_signup',
          description: `New ${user.role} registered: ${user.email}`,
          timestamp: user.createdAt,
          status: user.isVerified ? 'verified' : 'pending',
          data: user
        })),
        
        ...jobActivities.map(job => ({
          id: `job_${job.id}`,
          type: 'job_posted',
          description: `New job posted: ${job.title} at ${job.company || 'Unknown Company'}`,
          timestamp: job.createdAt,
          status: job.isActive ? 'active' : 'inactive',
          data: job
        })),
        
        ...companyActivities.map(company => ({
          id: `company_${company.id}`,
          type: 'company_registered',
          description: `New company registered: ${company.name}`,
          timestamp: company.createdAt,
          status: company.isVerified ? 'verified' : 'pending',
          data: company
        })),
        
        ...applicationActivities.map(app => ({
          id: `app_${app.id}`,
          type: 'application_submitted',
          description: `Application submitted for ${app.job.title} by ${app.user.name || app.user.email}`,
          timestamp: app.appliedAt,
          status: app.status,
          data: app
        }))
      ];

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      activities = activities.slice(0, limit);
      total = activities.length;

    } else {
      // Get specific type of activities
      switch (type) {
        case 'users':
          const users = await prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              isVerified: true,
              isActive: true
            }
          });
          
          activities = users.map(user => ({
            id: `user_${user.id}`,
            type: 'user_signup',
            description: `New ${user.role} registered: ${user.email}`,
            timestamp: user.createdAt,
            status: user.isVerified ? 'verified' : 'pending',
            data: user
          }));
          
          total = await prisma.user.count();
          break;

        case 'jobs':
          const jobs = await prisma.job.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              createdAt: true,
              isActive: true,
              isFeatured: true,
              createdBy: true
            }
          });
          
          activities = jobs.map(job => ({
            id: `job_${job.id}`,
            type: 'job_posted',
            description: `New job posted: ${job.title} at ${job.company || 'Unknown Company'}`,
            timestamp: job.createdAt,
            status: job.isActive ? 'active' : 'inactive',
            data: job
          }));
          
          total = await prisma.job.count();
          break;

        case 'companies':
          const companies = await prisma.company.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              industry: true,
              location: true,
              createdAt: true,
              isVerified: true
            }
          });
          
          activities = companies.map(company => ({
            id: `company_${company.id}`,
            type: 'company_registered',
            description: `New company registered: ${company.name}`,
            timestamp: company.createdAt,
            status: company.isVerified ? 'verified' : 'pending',
            data: company
          }));
          
          total = await prisma.company.count();
          break;

        case 'applications':
          const applications = await prisma.application.findMany({
            skip,
            take: limit,
            orderBy: { appliedAt: 'desc' },
            select: {
              id: true,
              status: true,
              appliedAt: true,
              userId: true,
              jobId: true,
              job: {
                select: {
                  title: true,
                  company: true
                }
              },
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          });
          
          activities = applications.map(app => ({
            id: `app_${app.id}`,
            type: 'application_submitted',
            description: `Application submitted for ${app.job.title} by ${app.user.name || app.user.email}`,
            timestamp: app.appliedAt,
            status: app.status,
            data: app
          }));
          
          total = await prisma.application.count();
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      },
      message: 'Admin activity data retrieved successfully'
    });

  } catch (error) {
    console.error('Admin activity error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin activity data'
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
