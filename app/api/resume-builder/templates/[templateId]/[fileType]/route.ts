import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string; fileType: string }> }
) {
  try {
    const { templateId, fileType } = await params;
    
    // Validate file type
    if (fileType !== 'html' && fileType !== 'css') {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "html" or "css"' },
        { status: 400 }
      );
    }

    // Construct file path
    const fileName = fileType === 'html' ? 'index.html' : 'style.css';
    const filePath = join(process.cwd(), 'public', 'templates', templateId, fileName);

    try {
      // Read file
      let fileContent = await readFile(filePath, 'utf-8');
      
      // For HTML files, extract body content if it's a full HTML document
      if (fileType === 'html') {
        const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          fileContent = bodyMatch[1].trim();
        } else if (!fileContent.includes('<!DOCTYPE') && !fileContent.includes('<html')) {
          // Already just body content
          fileContent = fileContent.trim();
        }
      }
      
      // Set appropriate content type
      const contentType = fileType === 'html' 
        ? 'text/html; charset=utf-8' 
        : 'text/css; charset=utf-8';

      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error(`[Template API] File not found: ${filePath}`, fileError);
      return NextResponse.json(
        { error: `Template file not found: ${templateId}/${fileName}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[Template API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

