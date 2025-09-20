import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { trackResumeView } from '@/lib/resume-view-tracker';

/**
 * GET /api/resumes/[id]/view
 * Securely serve resume files to authenticated users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { 
        id: id,
        userId: user.id 
      }
    });

    if (!resume) {
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
    } catch (error) {
      console.error('File not found:', filepath);
      return NextResponse.json({
        success: false,
        error: 'File not found on server'
      }, { status: 404 });
    }

    // Track resume view if viewer is not the resume owner
    if (user.id !== resume.userId) {
      // Determine viewer type
      let viewerType: 'employer' | 'admin' | 'other' = 'other';
      let companyId: string | undefined = undefined;

      if (user.role === 'employer') {
        viewerType = 'employer';
        // Get user's company ID
        const userCompany = await prisma.user.findUnique({
          where: { id: user.id },
          select: { companyRelation: { select: { id: true } } }
        });
        companyId = userCompany?.companyRelation?.id;
      } else if (user.role === 'admin') {
        viewerType = 'admin';
      }

      // Track the view
      await trackResumeView({
        resumeId: resume.id,
        viewerId: user.id,
        viewerType,
        companyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });
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

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // For PDFs, allow inline viewing
    if (contentType === 'application/pdf') {
      headers.set('Content-Disposition', `inline; filename="${resume.fileName}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    }

    console.log(`✅ Serving resume file: ${filename} (${contentType})`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error serving resume file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to serve resume file'
    }, { status: 500 });
  }
}
