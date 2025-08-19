import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const resume = await prisma.resume.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id)
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resume
    });

  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { content, reanalyze, changeNotes } = body;

    const resume = await prisma.resume.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id)
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const fieldsModified = Object.keys(content).filter(key => 
      resume[key as keyof typeof resume] !== content[key]
    );

    const updatedResume = await prisma.resume.update({
      where: { id: parseInt(id) },
      data: {
        ...content,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      fieldsModified
    });

  } catch (error: any) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const resume = await prisma.resume.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id)
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    await prisma.resume.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}