import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const industry = searchParams.get('industry') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          logo: true,
          location: true,
          industry: true,
          description: true,
          website: true,
          employeeCount: true,
          foundedYear: true,
          isVerified: true,
          _count: {
            select: {
              jobs: true
            }
          }
        },
        orderBy: [
          { isVerified: 'desc' },
          { _count: { jobs: 'desc' } },
          { name: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.company.count({ where })
    ]);

    // Transform data for frontend
    const transformedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      logo: company.logo,
      location: company.location,
      industry: company.industry,
      description: company.description,
      website: company.website,
      employeeCount: company.employeeCount,
      foundedYear: company.foundedYear,
      isVerified: company.isVerified,
      jobCount: company._count.jobs
    }));

    return NextResponse.json({
      success: true,
      companies: transformedCompanies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
    }, { status: 500 });
  }
}