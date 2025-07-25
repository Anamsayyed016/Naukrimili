import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get authenticated user's session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get employer profile
    const employer = await prisma.employer.findUnique({
      where: { userId: session.user.id },
      include: {
        jobs: {
          include: {
            applications: {
              include: {
                jobseeker: {
                  include: {
                    skills: true
                  }
                }
              }
            },
            views: true,
            _count: {
              select: {
                applications: true,
                views: true,
              }
            }
          }
        }
      }
    });

    if (!employer) {
      return NextResponse.json(
        { error: 'Employer profile not found' },
        { status: 404 }
      );
    }

    // Calculate analytics
    const jobs = employer.jobs;
    const totalViews = jobs.reduce((sum, job) => sum + job._count.views, 0);
    const totalApplications = jobs.reduce((sum, job) => sum + job._count.applications, 0);
    
    // Calculate hire rate
    const hiredApplications = jobs.reduce((sum, job) => 
      sum + job.applications.filter(app => app.status === 'HIRED').length, 0
    );
    const hireRate = totalApplications > 0 
      ? Math.round((hiredApplications / totalApplications) * 100)
      : 0;

    // Calculate top skills from applications
    const skillsMap = new Map();
    jobs.forEach(job => {
      job.applications.forEach(app => {
        app.jobseeker.skills.forEach(skill => {
          skillsMap.set(skill.name, (skillsMap.get(skill.name) || 0) + 1);
        });
      });
    });

    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    // Get trending data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await prisma.jobView.groupBy({
      by: ['createdAt'],
      where: {
        jobId: {
          in: jobs.map(j => j.id)
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Organize response data
    const analytics = {
      stats: {
        totalViews,
        applications: totalApplications,
        hireRate: `${hireRate}%`,
        topSkills
      },
      trending: trending.map(t => ({
        date: t.createdAt,
        views: t._count
      })),
      jobsBreakdown: jobs.map(job => ({
        id: job.id,
        title: job.title,
        views: job._count.views,
        applications: job._count.applications,
        status: job.status
      }))
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching employer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
