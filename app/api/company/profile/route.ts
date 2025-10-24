import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/company/profile - Starting request");
    const auth = await requireAuth();
    if ("error" in auth) {
      console.log("GET /api/company/profile - Auth error:", auth.error, "Status:", auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("GET /api/company/profile - User authenticated:", user.id, user.role);
    
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
        isVerified: true,
        benefits: true,
        specialties: true,
        culture: true,
        mission: true,
        vision: true,
        socialLinks: true
      }
    });

    if (!company) {
      console.log("GET /api/company/profile - Company not found for user:", user.id);
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    console.log("GET /api/company/profile - Company found:", company.id, company.name);

    const parsedCompany = {
      ...company,
      benefits: company.benefits ? JSON.parse(company.benefits) : null,
      specialties: company.specialties ? JSON.parse(company.specialties) : null,
      socialLinks: company.socialLinks ? JSON.parse(company.socialLinks) : null
    };

    return NextResponse.json({
      success: true,
      data: parsedCompany
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
      console.log("POST /api/company/profile - Auth error:", auth.error, "Status:", auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log("POST /api/company/profile - User authenticated:", user.id, user.role);
    
    const body = await request.json();
    console.log("POST /api/company/profile - Request body:", JSON.stringify(body, null, 2));
    
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

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!location) missingFields.push("location");
    if (!industry) missingFields.push("industry");
    if (!size) missingFields.push("size");
    // Google JobPosting schema compliance - require address fields
    if (!body.streetAddress) missingFields.push("streetAddress");
    if (!body.city) missingFields.push("city");
    if (!body.postalCode) missingFields.push("postalCode");

    if (missingFields.length > 0) {
      console.log("POST /api/company/profile - Missing required fields:", missingFields);
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
          message: "Street address, city, and postal code are required for Google job listing compliance"
        },
        { status: 400 }
      );
    }

    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (existingCompany) {
      console.log("POST /api/company/profile - Company already exists for user:", user.id);
      return NextResponse.json(
        { error: "Company already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    console.log("POST /api/company/profile - Creating company with data:", {
      name,
      description,
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
    });

    const company = await prisma.company.create({
      data: {
        name,
        description,
        website,
        location,
        streetAddress: body.streetAddress,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "IN",
        industry,
        size,
        founded: founded ? parseInt(founded) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        specialties: specialties ? JSON.stringify(specialties) : null,
        culture: culture || "",
        mission: mission || "",
        vision: vision || "",
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        isVerified: false,
        isActive: true,
        createdBy: user.id
      }
    });

    console.log("POST /api/company/profile - Company created successfully:", company.id);

    // Send real-time notification via Socket.io (enhanced with role-based notifications)
    try {
      const { getSocketService } = await import('@/lib/socket-server');
      const socketService = getSocketService();
      
      if (socketService) {
        // Notify admins about new company creation
        await socketService.sendNotificationToAdmins({
          type: 'COMPANY_CREATED',
          title: 'New Company Registration! 🏢',
          message: `A new company "${company.name}" has been registered and requires verification.`,
          data: {
            companyId: company.id,
            companyName: company.name,
            industry: company.industry,
            location: company.location,
            createdBy: user.id,
            action: 'verify_company',
            actionUrl: `/admin/companies/${company.id}`
          }
        });
        
        // Also emit legacy company_created event for backward compatibility
        socketService.io.emit('company_created', {
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          location: company.location,
          userId: user.id,
          timestamp: new Date().toISOString(),
          type: 'company_created'
        });
        console.log('📡 Role-based notification sent to admins for company creation');
      }
    } catch (socketError) {
      console.error('❌ Failed to send socket notification:', socketError);
      // Don't fail the company creation if socket notification fails
    }

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

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}
