import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/admin/resumes/[id]/download
 * Download resume files for admins (access to all resumes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { id: resumeId } = await params;
    
    // Validate resume ID format
    if (!resumeId || typeof resumeId !== 'string' || resumeId.length < 10) {
      console.error('❌ Invalid resume ID format:', resumeId);
      return NextResponse.json({
        success: false,
        error: 'Invalid resume ID format'
      }, { status: 400 });
    }
    
    console.log('🔍 Admin resume download request:', { resumeId, adminId: user.id });

    // Admins can access all resumes
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        applications: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true
              }
            }
          }
        }
      }
    });

    if (!resume) {
      console.log('❌ Resume not found:', resumeId);
      return NextResponse.json({
        success: false,
        error: 'Resume not found'
      }, { status: 404 });
    }

    // Extract filename from fileUrl
    const fileUrl = resume.fileUrl;
    if (!fileUrl || !fileUrl.startsWith('/uploads/resumes/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file path'
      }, { status: 400 });
    }

    // Construct full file path
    const filename = fileUrl.replace('/uploads/resumes/', '');
    const filepath = join(process.cwd(), 'uploads', 'resumes', filename);

    try {
      // Check if file exists
      await stat(filepath);
    } catch (_error) {
      console.error('File not found:', filepath);
      return NextResponse.json({
        success: false,
        error: 'File not found on server'
      }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filepath);
    
    // Determine content type based on file extension or mimeType
    let contentType = resume.mimeType || 'application/octet-stream';
    
    if (filename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (filename.endsWith('.txt')) {
      contentType = 'text/plain';
    }

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    console.log(`✅ Admin downloading resume: ${filename} (${contentType}) for candidate: ${resume.user.email}`);

    // Track resume view for analytics
    try {
      await prisma.resumeView.create({
        data: {
          resumeId: resume.id,
          viewerId: user.id,
          viewerType: 'admin',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (trackingError) {
      console.warn('Failed to track resume view:', trackingError);
      // Don't fail the download if tracking fails
    }

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error downloading resume file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to download resume file'
    }, { status: 500 });
  }
}

