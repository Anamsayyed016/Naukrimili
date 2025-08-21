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
    
    const company = await prisma.company.findFirst({
      where: { id: user.company.id },
      include: {
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

    return NextResponse.json({
      success: true,
      data: company
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
      founded
    } = body;

    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: {
        name: name || user.company.name,
        description,
        logo,
        website,
        location,
        industry,
        size,
        founded: founded ? parseInt(founded) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCompany,
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

