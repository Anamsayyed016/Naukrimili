import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJobSchema } from '@/lib/validation/job';

// GET /api/jobs - list jobs (optional filtering: ?q=&location=&company=)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const location = searchParams.get('location') || undefined;
    const company = searchParams.get('company') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min( parseInt(searchParams.get('pageSize') || '25', 10), 100);
  const skip = (page - 1) * pageSize;

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (company) where.company = { contains: company, mode: 'insensitive' };

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    ]);
    return NextResponse.json({ success: true, page, pageSize, total, jobs });
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST /api/jobs - create (minimal schema fields only)
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createJobSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const job = await prisma.job.create({
      data: {
        source: data.source,
        sourceId: data.sourceId,
        title: data.title,
        company: data.company ?? null,
        location: data.location ?? null,
        country: data.country,
        description: data.description,
        applyUrl: data.applyUrl ?? null,
        postedAt: data.postedAt ? new Date(data.postedAt as any) : null,
        salary: data.salary ?? null,
        rawJson: data.rawJson || {},
      } as any, // TEMP: stale Prisma client types missing source/sourceId
    });
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Jobs POST error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Duplicate (source, sourceId)' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';