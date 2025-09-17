import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("POST /api/company/profile - User authenticated:", user.id, user.role);
    
    
    // Get company profile
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        location: true,
        industry: true,
        size: true,
        founded: true,
        isVerified: true
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

export async function POST(request: NextRequest) {
    console.log("POST /api/company/profile - Starting");
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("POST /api/company/profile - User authenticated:", user.id, user.role);
    
    
    const body = await request.json();
    
    const {
      name,
      description,
      website,
      location,
      industry,
      size,
      founded,
      benefits,
      specialties,
      culture,
      mission,
      vision,
      socialLinks
    } = body;

    // Validate required fields
    if (!name || !description || !location || !industry || !size) {
      return NextResponse.json(
        { error: "Name, description, location, industry, and size are required" },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    // Create company profile
    const company = await prisma.company.create({
      data: {
        name,
        description,
        website,
        location,
        industry,
        size,
        founded: founded ? parseInt(founded) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        specialties: specialties ? JSON.stringify(specialties) : null,
        culture: culture || '',
        mission: mission || '',
        vision: vision || '',
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        isVerified: false,
        isActive: true, // Set company as active by default
        createdBy: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Company profile created successfully",
      data: company
    });
  } catch (error) {
    console.error("Error creating company profile:", error);
    return NextResponse.json(
      { error: "Failed to create company profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("POST /api/company/profile - User authenticated:", user.id, user.role);
    
    const body = await request.json();
    
    const {
      name,
      description,
      website,
      location,
      industry,
      size,
      founded,
      benefits,
      specialties,
      culture,
      mission,
      vision,
      socialLinks
    } = body;

    // Validate required fields
    if (!name || !description || !location || !industry || !size) {
      return NextResponse.json(
        { error: "Name, description, location, industry, and size are required" },
        { status: 400 }
      );
    }

    // Update company profile
    const company = await prisma.company.updateMany({
      where: { createdBy: user.id },
      data: {
        name,
        description,
        website,
        location,
        industry,
        size,
        founded: founded ? parseInt(founded) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        specialties: specialties ? JSON.stringify(specialties) : null,
        culture: culture || '',
        mission: mission || '',
        vision: vision || '',
        socialLinks: socialLinks || {}
      }
    });

    return NextResponse.json({
      success: true,
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
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("POST /api/company/profile - User authenticated:", user.id, user.role);
    

    // Check if company exists
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id: existingCompany.id }
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
