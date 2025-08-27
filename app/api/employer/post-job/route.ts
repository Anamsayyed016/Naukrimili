import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();

    // Get the user's company
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please complete your company profile first." },
        { status: 400 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: body.title,
        company: company.name,
        location: body.location,
        country: body.country || 'IN',
        description: body.description,
        requirements: body.requirements ? [body.requirements] : [],
        salary: body.salary,
        jobType: body.jobType,
        experienceLevel: body.experienceLevel,
        skills: body.skills || [],
        isRemote: body.isRemote || false,
        isHybrid: body.isHybrid || false,
        isUrgent: body.isUrgent || false,
        isFeatured: body.isFeatured || false,
        sector: body.sector,
        source: 'manual',
        sourceId: `manual_${Date.now()}`,
        createdBy: user.id,
        companyId: company.id,
        rawJson: body
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location
      }
    });

  } catch (error) {
    console.error('Error posting job:', error);
    return NextResponse.json(
      { error: 'Failed to post job' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
