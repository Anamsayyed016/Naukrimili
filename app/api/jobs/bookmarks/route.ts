import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs/bookmarks - Get user's bookmarked jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [total, bookmarks] = await Promise.all([
      prisma.jobBookmark.count({ 
        where: { userId: parseInt(userId) } 
      }),
      prisma.jobBookmark.findMany({
        where: { userId: parseInt(userId) },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              description: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              jobType: true,
              experienceLevel: true,
              skills: true,
              isRemote: true,
              isHybrid: true,
              isUrgent: true,
              isFeatured: true,
              sector: true,
              applyUrl: true,
              postedAt: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const jobs = bookmarks.map(bookmark => ({
      id: bookmark.job.id.toString(),
      title: bookmark.job.title,
      company: bookmark.job.company || 'Unknown Company',
      companyLogo: bookmark.job.companyLogo,
      location: bookmark.job.location || 'Remote',
      description: bookmark.job.description,
      salary_formatted: formatSalary(bookmark.job.salaryMin, bookmark.job.salaryMax, bookmark.job.salaryCurrency || 'INR'),
      time_ago: getTimeAgo(bookmark.job.createdAt),
      redirect_url: bookmark.job.applyUrl || `/jobs/${bookmark.job.id}`,
      is_remote: bookmark.job.isRemote,
      is_hybrid: bookmark.job.isHybrid,
      is_urgent: bookmark.job.isUrgent,
      is_featured: bookmark.job.isFeatured,
      job_type: bookmark.job.jobType,
      experience_level: bookmark.job.experienceLevel,
      skills: bookmark.job.skills,
      sector: bookmark.job.sector,
      posted_at: bookmark.job.postedAt?.toISOString(),
      created_at: bookmark.job.createdAt.toISOString(),
      bookmarked_at: bookmark.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Bookmarks GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch bookmarks' 
    }, { status: 500 });
  }
}

// POST /api/jobs/bookmarks - Add job to bookmarks
export async function POST(request: NextRequest) {
  try {
    const { userId, jobId } = await request.json();

    if (!userId || !jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and Job ID are required' 
      }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) }
    });

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found' 
      }, { status: 404 });
    }

    // Create bookmark (upsert to handle duplicates)
    const bookmark = await prisma.jobBookmark.upsert({
      where: {
        userId_jobId: {
          userId: parseInt(userId),
          jobId: parseInt(jobId)
        }
      },
      update: {},
      create: {
        userId: parseInt(userId),
        jobId: parseInt(jobId)
      }
    });

    return NextResponse.json({ 
      success: true, 
      bookmark: {
        id: bookmark.id,
        userId: bookmark.userId,
        jobId: bookmark.jobId,
        createdAt: bookmark.createdAt
      }
    });

  } catch (error) {
    console.error('Bookmark POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add bookmark' 
    }, { status: 500 });
  }
}

// DELETE /api/jobs/bookmarks - Remove job from bookmarks
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    if (!userId || !jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and Job ID are required' 
      }, { status: 400 });
    }

    await prisma.jobBookmark.deleteMany({
      where: {
        userId: parseInt(userId),
        jobId: parseInt(jobId)
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Bookmark removed successfully' 
    });

  } catch (error) {
    console.error('Bookmark DELETE error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove bookmark' 
    }, { status: 500 });
  }
}

// Helper functions (same as main jobs route)
function formatSalary(min?: number | null, max?: number | null, currency = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
  
  if (!min && !max) return 'Salary not disclosed';
  
  const formatAmount = (amount: number) => {
    if (currency === 'INR') {
      if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)}L`;
      }
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };
  
  if (min && max) {
    return `${symbol}${formatAmount(min)} - ${formatAmount(max)}`;
  } else if (min) {
    return `${symbol}${formatAmount(min)}+`;
  } else if (max) {
    return `Up to ${symbol}${formatAmount(max)}`;
  }
  
  return 'Salary not disclosed';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

export const dynamic = 'force-dynamic';
