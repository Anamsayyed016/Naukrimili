import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/resumes/[id]/download
 * Download resume files for authenticated users
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

    console.log(`✅ Downloading resume file: ${filename} (${contentType})`);

    return new NextResponse(fileBuffer, {
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
