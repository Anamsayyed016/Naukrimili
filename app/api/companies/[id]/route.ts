import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            _count: {
              select: {
                applications: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { isVerified, isActive, name, description, website, location, industry, size, founded } = body;

    const updateData: any = {};
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (website) updateData.website = website;
    if (location) updateData.location = location;
    if (industry) updateData.industry = industry;
    if (size) updateData.size = size;
    if (founded) updateData.founded = founded;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        location: true,
        industry: true,
        size: true,
        founded: true,
        isVerified: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany
    });

  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete company (this will cascade delete related records)
    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete company" },
      { status: 500 }
    );
  }
}