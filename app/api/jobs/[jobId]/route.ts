import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const job = await prisma.job.findUnique({ where: { id: params.jobId } });
    if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, job });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Job GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const data = await request.json();
    const updateData: any = {
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements,
      benefits: data.benefits,
      skills: data.skills,
      salaryMin: data.salary?.min ?? null,
      salaryMax: data.salary?.max ?? null,
      salaryCurrency: data.salary?.currency ?? 'INR',
      type: data.type,
      level: data.level,
      remote: data.remote,
      status: data.status,
      sector: data.sector,
    };
    const job = await prisma.job.update({
      where: { id: params.jobId },
      data: updateData,
    });
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    // eslint-disable-next-line no-console
    console.error('Job PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    await prisma.job.delete({ where: { id: params.jobId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    // eslint-disable-next-line no-console
    console.error('Job DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';