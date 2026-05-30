import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobCacheService } from "@/lib/job-cache-service";
import { logJobApiTiming, type JobApiTimings } from "@/lib/jobs/api-perf";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timings: JobApiTimings = {};
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const sector = searchParams.get("sector") || "";
    const search = searchParams.get("search") || "";
    const isGlobal = searchParams.get("isGlobal");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    console.log('🌍 Public companies API called with params:', { limit, sector, search, isGlobal, page });

    // Public listings: active verified companies + employer portal companies (createdBy set)
    const where: any = {
      isActive: true,
      AND: [
        { OR: [{ isVerified: true }, { createdBy: { not: null } }] },
      ],
    };

    // Filter by sector
    if (sector && sector !== "all") {
      where.AND.push({
        OR: [
          { sector: { contains: sector, mode: "insensitive" } },
          { industry: { contains: sector, mode: "insensitive" } },
        ],
      });
    }

    // Filter by search term
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { sector: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Filter by global/employer
    if (isGlobal !== null && isGlobal !== undefined) {
      where.isGlobal = isGlobal === "true";
    }

    console.log('🔍 Query where clause:', where);

    const cacheKey = `p${page}|l${limit}|s${sector}|q${search}|g${isGlobal ?? 'all'}`;
    const cached = await jobCacheService.get<Record<string, unknown>>(cacheKey, 'api_companies');
    if (cached) {
      timings.cacheHit = true;
      timings.totalMs = Date.now() - startTime;
      logJobApiTiming('GET /api/companies-list', timings);
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
      });
    }

    const prismaStart = Date.now();
    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
        industry: true,
        sector: true,
        website: true,
        careerPageUrl: true,
        size: true,
        founded: true,
        isGlobal: true,
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: [
        { jobs: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
      }),
    ]);
    timings.prismaMs = Date.now() - prismaStart;
    console.log(`📊 Found ${total} total companies; retrieved ${companies.length}`);

    // Remove duplicates by name (case-insensitive)
    const uniqueCompanies = companies.reduce((acc: any[], company) => {
      const exists = acc.find(c => 
        c.name.toLowerCase() === company.name.toLowerCase()
      );
      if (!exists) {
        acc.push(company);
      }
      return acc;
    }, []);

    console.log(`🔄 After deduplication: ${uniqueCompanies.length} unique companies`);

    const response = {
      success: true,
      companies: uniqueCompanies.map(company => ({
        id: company.id,
        name: company.name,
        description: company.description || '',
        logo: company.logo,
        location: company.location || '',
        industry: company.industry || '',
        sector: company.sector || company.industry || '',
        website: company.website,
        careerPageUrl: company.careerPageUrl || company.website || '',
        size: company.size,
        founded: company.founded,
        isGlobal: company.isGlobal || false,
        jobCount: company._count.jobs
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    timings.totalMs = Date.now() - startTime;
    logJobApiTiming('GET /api/companies-list', timings, { count: response.companies.length });
    await jobCacheService.set(cacheKey, response, 'api_companies');

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
    });

  } catch (error: any) {
    console.error('❌ Error fetching public companies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch companies',
        details: error.message,
        companies: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      }, 
      { status: 500 }
    );
  }
}