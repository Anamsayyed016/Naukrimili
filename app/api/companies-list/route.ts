import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const sector = searchParams.get("sector") || "";
    const search = searchParams.get("search") || "";
    const isGlobal = searchParams.get("isGlobal");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    console.log('🌍 Public companies API called with params:', { limit, sector, search, isGlobal, page });

    // Build where clause
    const where: any = {
      isVerified: true,
      isActive: true
    };

    // Filter by sector
    if (sector && sector !== "all") {
      where.OR = [
        { sector: { contains: sector, mode: "insensitive" } },
        { industry: { contains: sector, mode: "insensitive" } }
      ];
    }

    // Filter by search term
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { sector: { contains: search, mode: "insensitive" } },
            { industry: { contains: search, mode: "insensitive" } }
          ]
        }
      ];
    }

    // Filter by global/employer
    if (isGlobal !== null && isGlobal !== undefined) {
      where.isGlobal = isGlobal === "true";
    }

    console.log('🔍 Query where clause:', where);

    // Get total count for pagination
    const total = await prisma.company.count({ where });
    console.log(`📊 Found ${total} total companies matching criteria`);

    // Get public companies (verified and active) with job counts
    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
        industry: true,
        sector: true, // Include sector field
        website: true,
        careerPageUrl: true, // Include career page URL
        size: true,
        founded: true,
        isGlobal: true, // Include isGlobal field
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
        { jobs: { _count: 'desc' } }, // Sort by job count first
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    console.log(`✅ Retrieved ${companies.length} companies from database`);

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
        sector: company.sector || company.industry || '', // Use industry as sector fallback
        website: company.website,
        careerPageUrl: company.careerPageUrl || company.website || '', // Use website as career page fallback
        size: company.size,
        founded: company.founded,
        isGlobal: company.isGlobal || false, // Default to false
        jobCount: company._count.jobs
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    console.log(`🎉 Returning ${response.companies.length} companies to frontend`);
    return NextResponse.json(response);

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
