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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Get resume data
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

    // Export logic based on format
    let exportResult;
    let response;

    switch (format.toLowerCase()) {
      case 'pdf':
        exportResult = await exportToPDF(resume);
        response = {
          success: true,
          message: 'Resume exported to PDF successfully',
          data: {
            filename: exportResult.filename,
            downloadUrl: exportResult.downloadUrl,
            format: 'pdf'
          }
        };
        break;

      case 'docx':
        exportResult = await exportToDOCX(resume);
        response = {
          success: true,
          message: 'Resume exported to DOCX successfully',
          data: {
            filename: exportResult.filename,
            downloadUrl: exportResult.downloadUrl,
            format: 'docx'
          }
        };
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Resume export error:', error);
    return NextResponse.json(
      { error: 'Failed to export resume' },
      { status: 500 }
    );
  }
}

async function exportToPDF(resume: any) {
  // Mock PDF export - replace with actual PDF generation
  return {
    filename: `${resume.user.name}_Resume.pdf`,
    downloadUrl: `/api/resumes/${resume.id}/download?format=pdf`
  };
}

async function exportToDOCX(resume: any) {
  // Mock DOCX export - replace with actual DOCX generation
  return {
    filename: `${resume.user.name}_Resume.docx`,
    downloadUrl: `/api/resumes/${resume.id}/download?format=docx`
  };
}
