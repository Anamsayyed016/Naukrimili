import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs - list jobs with optional basic filtering (?q=, ?location=, ?company=)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const location = searchParams.get('location');
    const company = searchParams.get('company');

    const where: any = {};
    if (q) {
      // MongoDB-style OR using contains for title/company (Prisma with Mongo provider uses contains)
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (company) where.company = { contains: company, mode: 'insensitive' };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // soft cap
    });
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Jobs GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST /api/jobs - create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['title', 'company', 'location', 'description'];
    const missing = required.filter(f => !body[f]);
    if (missing.length) {
      return NextResponse.json({ success: false, error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // TODO: Replace with real authenticated user ID
    const userId = body.userId || process.env.SEED_USER_ID || '000000000000000000000000';

    const job = await prisma.job.create({
      data: {
        title: body.title,
        company: body.company,
        location: body.location,
        description: body.description,
        requirements: body.requirements ?? [],
        benefits: body.benefits ?? [],
        skills: body.skills ?? [],
        salaryMin: body.salary?.min ?? null,
        salaryMax: body.salary?.max ?? null,
        salaryCurrency: body.salary?.currency ?? 'INR',
        type: body.type || 'FULL_TIME',
        level: body.level || 'ENTRY',
        remote: Boolean(body.remote),
        status: body.status || 'PUBLISHED',
        sector: body.sector || null,
        userId,
      },
    });
    return NextResponse.json({ success: true, job });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Jobs POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';