import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const industry = searchParams.get('industry') || '';
    const location = searchParams.get('location') || '';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { jobs: true }
          }
        }
      }),
      prisma.company.count({ where })
    ]);
    
    // Format response
    const formattedCompanies = companies.map(company => ({
      ...company,
      jobCount: company._count.jobs
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
