import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const applicationId = params.id;

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        companyId: company.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            bio: true,
            skills: true,
            experience: true,
            education: true,
            profilePicture: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            company: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            parsedData: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const applicationId = params.id;
    const body = await request.json();

    const { status, notes } = body;

    // Check if application exists and belongs to company
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        companyId: company.id
      }
    });

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status || undefined,
        notes: notes || undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: "Application updated successfully"
    });

  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
