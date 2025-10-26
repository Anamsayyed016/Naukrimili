import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company's jobs
    const jobs = await prisma.job.findMany({
      where: { 
        companyId: companyId,
        isActive: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isUrgent: 'desc' },
        { postedAt: 'desc' }
      ]
    });

    return NextResponse.json(jobs);

  } catch (_error) {
    console.error('Error fetching company jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company jobs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
