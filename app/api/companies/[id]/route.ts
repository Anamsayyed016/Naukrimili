import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id, 10);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            jobs: true,
            applications: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company's active jobs
    const activeJobs = await prisma.job.findMany({
      where: { 
        companyId: companyId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        location: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isUrgent: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const companyData = {
      ...company,
      openJobs: company._count.jobs,
      totalApplications: company._count.applications,
      recentJobs: activeJobs
    };

    return NextResponse.json({
      success: true,
      data: companyData
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}