import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    
    // Get company profile with detailed information
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
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
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Calculate additional statistics
    const stats = await prisma.job.aggregate({
      where: { companyId: company.id },
      _count: {
        id: true
      }
    });

    const applicationStats = await prisma.application.aggregate({
      where: {
        job: { companyId: company.id }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        stats: {
          totalJobs: stats._count.id,
          totalApplications: applicationStats._count.id,
          activeJobs: company.jobs.filter(job => job.isActive).length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    
    const {
      name,
      description,
      logo,
      website,
      location,
      industry,
      size,
      founded,
      socialLinks
    } = body;

    // Validate required fields
    if (!name || !description || !location || !industry || !size) {
      return NextResponse.json(
        { error: "Name, description, location, industry, and size are required" },
        { status: 400 }
      );
    }

    // Validate website URL if provided
    if (website && !website.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { error: "Please provide a valid website URL (e.g., https://company.com)" },
        { status: 400 }
      );
    }

    // Validate founding year if provided
    if (founded && (parseInt(founded) < 1800 || parseInt(founded) > new Date().getFullYear())) {
      return NextResponse.json(
        { error: "Please provide a valid founding year" },
        { status: 400 }
      );
    }

    // Update company profile
    const updatedCompany = await prisma.company.updateMany({
      where: { createdBy: user.id },
      data: {
        name,
        description,
        logo,
        website,
        location,
        industry,
        size,
        founded: founded ? parseInt(founded) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        updatedAt: new Date()
      }
    });

    if (updatedCompany.count === 0) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get updated company data
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    return NextResponse.json({
      success: true,
      data: company,
      message: "Company profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json(
      { error: "Failed to update company profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    // Check if company has active jobs
    const activeJobsCount = await prisma.job.count({
      where: {
        companyId: user.company.id,
        isActive: true
      }
    });

    if (activeJobsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with active jobs. Please deactivate all jobs first." },
        { status: 400 }
      );
    }

    // Delete company and all related data
    await prisma.$transaction(async (tx) => {
      // Delete applications for company jobs
      await tx.application.deleteMany({
        where: {
          job: { companyId: user.company.id }
        }
      });

      // Delete job bookmarks for company jobs
      await tx.jobBookmark.deleteMany({
        where: {
          job: { companyId: user.company.id }
        }
      });

      // Delete company jobs
      await tx.job.deleteMany({
        where: { companyId: user.company.id }
      });

      // Delete company
      await tx.company.delete({
        where: { id: user.company.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Company profile deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting company profile:", error);
    return NextResponse.json(
      { error: "Failed to delete company profile" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}