import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdminAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== "admin") {
    return { error: "Access denied. Admin account required.", status: 403 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      // Get specific content
      const content = await prisma.staticContent.findUnique({
        where: { key }
      });

      if (!content) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: content
      });
    } else {
      // Get all content
      const contents = await prisma.staticContent.findMany({
        orderBy: { key: "asc" }
      });

      return NextResponse.json({
        success: true,
        data: contents
      });
    }

  } catch (error) {
    console.error("Error fetching static content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { key, title, content } = body;

    if (!key || !title || !content) {
      return NextResponse.json(
        { error: "Key, title, and content are required" },
        { status: 400 }
      );
    }

    const newContent = await prisma.staticContent.create({
      data: {
        key,
        title,
        content,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: newContent,
      message: "Static content created successfully"
    });

  } catch (error) {
    console.error("Error creating static content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { key, title, content, isActive } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const updatedContent = await prisma.staticContent.update({
      where: { key },
      data: {
        title: title || undefined,
        content: content || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: "Static content updated successfully"
    });

  } catch (error) {
    console.error("Error updating static content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
