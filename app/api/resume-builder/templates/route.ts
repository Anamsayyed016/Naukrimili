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
    
    // Health check endpoint
    if (!templateId && !fileType) {
      return NextResponse.json({
        status: 'ok',
        message: 'Template API is working',
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[Template API Query] ===== REQUEST RECEIVED =====`);
    console.log(`[Template API Query] URL: ${request.url}`);
    console.log(`[Template API Query] templateId: ${templateId}`);
    console.log(`[Template API Query] fileType: ${fileType}`);
    console.log(`[Template API Query] CWD: ${process.cwd()}`);
    console.log(`[Template API Query] NODE_ENV: ${process.env.NODE_ENV}`);
    
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

    // Construct file path - try multiple possible locations
    const fileName = fileType === 'html' ? 'index.html' : 'style.css';
    
    // Try multiple path locations (development, production, different build outputs)
    const cwd = process.cwd();
    const possiblePaths = [
      join(cwd, 'public', 'templates', templateId, fileName),
      join(cwd, 'templates', templateId, fileName),
      join(cwd, '.next', 'static', 'templates', templateId, fileName),
      join(cwd, 'out', 'templates', templateId, fileName),
      // Production paths (when deployed)
      join(cwd, '..', 'public', 'templates', templateId, fileName),
      join(cwd, '..', 'templates', templateId, fileName),
      // Absolute path fallbacks
      `/var/www/html/public/templates/${templateId}/${fileName}`,
      `/home/public/templates/${templateId}/${fileName}`,
    ];
    
    console.log(`[Template API Query] Checking ${possiblePaths.length} possible paths...`);
    
    let filePath: string | null = null;
    let foundPath: string | null = null;
    
    // Find the first existing path
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        foundPath = path;
        break;
      }
    }
    
    // If not found, use the primary path and let it fail with better error
    if (!foundPath) {
      filePath = possiblePaths[0];
      console.error(`[Template API Query] File does not exist at any of these paths:`);
      possiblePaths.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
      
      return NextResponse.json(
        { 
          error: `Template file not found: ${templateId}/${fileName}`, 
          templateId,
          fileType,
          triedPaths: possiblePaths,
          cwd: process.cwd()
        },
        { status: 404 }
      );
    }
    
    filePath = foundPath;
    console.log(`[Template API Query] Found file at: ${filePath}`);

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
        { 
          error: `Failed to read template file: ${templateId}/${fileName}`, 
          templateId,
          fileType,
          path: filePath,
          details: fileError instanceof Error ? fileError.message : 'Unknown error',
          stack: fileError instanceof Error ? fileError.stack : undefined
        },
        { status: 500 }
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

