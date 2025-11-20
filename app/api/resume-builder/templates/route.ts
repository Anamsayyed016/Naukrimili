/**
 * Template File Serving API (Query Parameter Version)
 * More reliable than nested dynamic routes in Next.js 15
 * 
 * GET /api/resume-builder/templates?templateId=executive-blue&fileType=html
 * GET /api/resume-builder/templates?templateId=executive-blue&fileType=css
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Force dynamic rendering for file reading
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to process file content
function processFileContent(fileContent: string, fileType: string): string {
  if (fileType === 'html') {
    // For HTML files, extract body content if it's a full HTML document
    const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1].trim();
      console.log(`[Template API] Extracted body content, new length: ${bodyContent.length} chars`);
      return bodyContent;
    } else if (!fileContent.includes('<!DOCTYPE') && !fileContent.includes('<html')) {
      // Already just body content
      console.log(`[Template API] Content already body-only`);
      return fileContent.trim();
    }
    // If full HTML document but no body tag found, return as-is (will be handled by renderer)
    console.log(`[Template API] Full HTML document, returning as-is`);
    return fileContent.trim();
  }
  // For CSS, just return trimmed content
  return fileContent.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const fileType = searchParams.get('fileType');
    
    console.log(`[Template API Query] Request received - templateId: ${templateId}, fileType: ${fileType}`);
    
    // Validate parameters
    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId parameter is required' },
        { status: 400 }
      );
    }
    
    if (!fileType || (fileType !== 'html' && fileType !== 'css')) {
      return NextResponse.json(
        { error: 'fileType parameter must be "html" or "css"' },
        { status: 400 }
      );
    }

    // Construct file path
    const fileName = fileType === 'html' ? 'index.html' : 'style.css';
    const filePath = join(process.cwd(), 'public', 'templates', templateId, fileName);
    
    console.log(`[Template API Query] Constructed file path: ${filePath}`);
    console.log(`[Template API Query] Current working directory: ${process.cwd()}`);
    
    // Check if file exists before attempting to read
    if (!existsSync(filePath)) {
      console.error(`[Template API Query] File does not exist: ${filePath}`);
      
      // Try alternative path formats
      const altPaths = [
        join(process.cwd(), 'public', 'templates', templateId, fileName),
        join(process.cwd(), 'templates', templateId, fileName),
      ];
      
      for (const altPath of altPaths) {
        if (existsSync(altPath)) {
          console.log(`[Template API Query] Found file at alternative path: ${altPath}`);
          const fileContent = await readFile(altPath, 'utf-8');
          const processedContent = processFileContent(fileContent, fileType);
          const contentType = fileType === 'html' ? 'text/html; charset=utf-8' : 'text/css; charset=utf-8';
          return new NextResponse(processedContent, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
      
      return NextResponse.json(
        { error: `Template file not found: ${templateId}/${fileName}`, path: filePath, triedPaths: altPaths },
        { status: 404 }
      );
    }

    try {
      // Read file
      console.log(`[Template API Query] Reading file: ${filePath}`);
      const fileContent = await readFile(filePath, 'utf-8');
      console.log(`[Template API Query] File read successfully, length: ${fileContent.length} chars`);
      
      // Process file content
      const processedContent = processFileContent(fileContent, fileType);
      
      // Set appropriate content type
      const contentType = fileType === 'html' 
        ? 'text/html; charset=utf-8' 
        : 'text/css; charset=utf-8';

      console.log(`[Template API Query] Returning file content with Content-Type: ${contentType}, length: ${processedContent.length}`);
      return new NextResponse(processedContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fileError) {
      console.error(`[Template API Query] Error reading file: ${filePath}`, fileError);
      return NextResponse.json(
        { error: `Template file not found: ${templateId}/${fileName}`, details: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[Template API Query] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

