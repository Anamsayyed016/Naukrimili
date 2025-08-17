import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireEmployerAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { createdCompanies: true }
  });

  if (!user || user.role !== "employer" || !user.createdCompanies.length) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }

  return { user, company: user.createdCompanies[0] };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
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
      where: { id: company.id },
      data: {
        name: name || undefined,
        description: description || undefined,
        logo: logo || undefined,
        website: website || undefined,
        location: location || undefined,
        industry: industry || undefined,
        size: size || undefined,
        founded: founded ? parseInt(founded) : undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: "Company profile updated successfully"
    });

  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

