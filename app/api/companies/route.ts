import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (industry && industry !== 'all') {
      where.industry = industry;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get companies with job counts
    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ],
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await prisma.company.count({ where });

    return NextResponse.json(companies, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Limit': limit.toString(),
        'X-Total-Pages': Math.ceil(total / limit).toString()
      }
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
