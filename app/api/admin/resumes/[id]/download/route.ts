import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/admin/resumes/[id]/download
 * Download a resume file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Find the resume
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Track resume view for analytics
    try {
      await prisma.resumeView.create({
        data: {
          resumeId: resume.id,
          viewerType: 'admin',
          viewerId: auth.user.id
        }
      });
    } catch (viewError) {
      // Log but don't fail the download if view tracking fails
      console.error('Error tracking resume view:', viewError);
    }

    // If fileUrl is a local file path, read from filesystem
    if (resume.fileUrl.startsWith('/') || resume.fileUrl.startsWith('./')) {
      try {
        const filePath = path.join(process.cwd(), resume.fileUrl);
        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': resume.mimeType || 'application/pdf',
            'Content-Disposition': `attachment; filename="${resume.fileName}"`,
            'Content-Length': fileBuffer.length.toString()
          }
        });
      } catch (fileError) {
        console.error('Error reading file from local storage:', fileError);
        // Fall through to try as URL
      }
    }

    // If fileUrl is a URL, redirect to it
    if (resume.fileUrl.startsWith('http://') || resume.fileUrl.startsWith('https://')) {
      return NextResponse.redirect(resume.fileUrl);
    }

    // If fileUrl is a GCS path, try to fetch it
    if (resume.fileUrl.startsWith('gs://')) {
      // For GCS files, you would need to use the GCS client library
      // For now, return an error
      return NextResponse.json(
        { error: 'GCS file download not implemented yet' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to download resume file' },
      { status: 500 }
    );
  } catch (_error) {
    console.error('Error downloading resume:', _error);
    return NextResponse.json(
      { error: 'Failed to download resume' },
      { status: 500 }
    );
  }
}