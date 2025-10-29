import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Public company detail API: Fetching company:', id);

    const company = await prisma.company.findFirst({
      where: { 
        id,
        isActive: true
        // Show all active companies, verification is optional
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        location: true,
        industry: true,
        size: true,
        founded: true,
        isVerified: true,
        socialLinks: true,
        benefits: true,
        specialties: true,
        culture: true,
        mission: true,
        vision: true,
        createdAt: true,
        updatedAt: true,
        jobs: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            salary: true,
            isRemote: true,
            isHybrid: true,
            isUrgent: true,
            isFeatured: true,
            createdAt: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            jobs: true,
            applications: true
          }
        }
      }
    });

    if (!company) {
      console.log('❌ Company not found or not public:', id);
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Public company detail API: Found company ${company.name} with ${company.jobs.length} jobs`);

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (_error) {
    console.error("❌ Error fetching public company:", _error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}
