import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Force dynamic rendering for file reading
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string; fileType: string }> }
) {
  try {
    const { templateId, fileType } = await params;
    
    console.log(`[Template API] Request received - templateId: ${templateId}, fileType: ${fileType}`);
    
    // Validate file type
    if (fileType !== 'html' && fileType !== 'css') {
      console.error(`[Template API] Invalid file type: ${fileType}`);
      return NextResponse.json(
        { error: 'Invalid file type. Must be "html" or "css"' },
        { status: 400 }
      );
    }

    // Construct file path
    const fileName = fileType === 'html' ? 'index.html' : 'style.css';
    const filePath = join(process.cwd(), 'public', 'templates', templateId, fileName);
    
    console.log(`[Template API] Constructed file path: ${filePath}`);
    console.log(`[Template API] Current working directory: ${process.cwd()}`);
    
    // Check if file exists before attempting to read
    if (!existsSync(filePath)) {
      console.error(`[Template API] File does not exist: ${filePath}`);
      return NextResponse.json(
        { error: `Template file not found: ${templateId}/${fileName}`, path: filePath },
        { status: 404 }
      );
    }

    try {
      // Read file
      console.log(`[Template API] Reading file: ${filePath}`);
      let fileContent = await readFile(filePath, 'utf-8');
      console.log(`[Template API] File read successfully, length: ${fileContent.length} chars`);
      
      // For HTML files, extract body content if it's a full HTML document
      if (fileType === 'html') {
        const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          fileContent = bodyMatch[1].trim();
          console.log(`[Template API] Extracted body content, new length: ${fileContent.length} chars`);
        } else if (!fileContent.includes('<!DOCTYPE') && !fileContent.includes('<html')) {
          // Already just body content
          fileContent = fileContent.trim();
          console.log(`[Template API] Content already body-only`);
        }
      }
      
      // Set appropriate content type
      const contentType = fileType === 'html' 
        ? 'text/html; charset=utf-8' 
        : 'text/css; charset=utf-8';

      console.log(`[Template API] Returning file content with Content-Type: ${contentType}`);
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error(`[Template API] Error reading file: ${filePath}`, fileError);
      return NextResponse.json(
        { error: `Template file not found: ${templateId}/${fileName}`, details: fileError instanceof Error ? fileError.message : 'Unknown error' },
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

