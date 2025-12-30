/**
 * Template File Serving API (Query Parameter Version)
 * More reliable than nested dynamic routes in Next.js 15
 * 
 * GET /api/resume-builder/templates?templateId=executive-blue&fileType=html
 * GET /api/resume-builder/templates?templateId=executive-blue&fileType=css
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, sep } from 'path';
import { existsSync, readdirSync } from 'fs';

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
    
    // Normalize templateId to handle any encoding/decoding issues
    const normalizedTemplateId = decodeURIComponent(templateId).trim();
    
    // Try multiple path locations (development, production, different build outputs)
    const cwd = process.cwd();
    
    // CRITICAL FIX: Detect if we're running from Next.js standalone directory
    // In standalone mode, the server runs from .next/standalone, so process.cwd() is .next/standalone
    const isStandalone = cwd.includes('.next' + sep + 'standalone') || 
                         cwd.includes('.next\\standalone') ||
                         cwd.endsWith('standalone');
    const parentDir = isStandalone ? join(cwd, '..', '..') : cwd;
    
    // CRITICAL FIX: Handle production deployment where app runs from release directory
    // Check if we're in a release directory structure (e.g., /var/www/naukrimili/releases/release-xxx/)
    const isReleaseDir = cwd.includes('/releases/release-') || cwd.includes('\\releases\\release-');
    const baseDir = isReleaseDir ? cwd.split(/[/\\]releases[/\\]release-[^/\\]+/)[0] || cwd : cwd;
    
    const possiblePaths = [
      // CRITICAL: Primary path - when running from standalone, this is .next/standalone/public/templates/...
      // When running normally, this is project_root/public/templates/...
      join(cwd, 'public', 'templates', normalizedTemplateId, fileName),
      // Try with original templateId as well (in case encoding is needed)
      join(cwd, 'public', 'templates', templateId, fileName),
      // CRITICAL: If running from standalone, check parent directory (original source)
      // This ensures we can find files even if standalone copy failed or is incomplete
      ...(isStandalone ? [
        join(parentDir, 'public', 'templates', normalizedTemplateId, fileName),
        join(parentDir, 'public', 'templates', templateId, fileName),
      ] : []),
      // Production path: if in release directory, check base app directory and current symlink
      ...(isReleaseDir ? [
        join(baseDir, 'public', 'templates', normalizedTemplateId, fileName),
        join(baseDir, 'public', 'templates', templateId, fileName),
        join(baseDir, 'current', 'public', 'templates', normalizedTemplateId, fileName),
        join(baseDir, 'current', 'public', 'templates', templateId, fileName),
      ] : []),
      // Alternative locations
      join(cwd, 'templates', normalizedTemplateId, fileName),
      join(cwd, 'templates', templateId, fileName),
      join(cwd, '.next', 'static', 'templates', normalizedTemplateId, fileName),
      join(cwd, 'out', 'templates', normalizedTemplateId, fileName),
      // Production paths (when deployed) - check parent directory
      join(cwd, '..', 'public', 'templates', normalizedTemplateId, fileName),
      join(cwd, '..', 'templates', normalizedTemplateId, fileName),
      // Absolute path fallbacks (Linux production) - check common deployment paths
      `/var/www/naukrimili/public/templates/${normalizedTemplateId}/${fileName}`,
      `/var/www/naukrimili/current/public/templates/${normalizedTemplateId}/${fileName}`,
      `/var/www/html/public/templates/${normalizedTemplateId}/${fileName}`,
      `/home/public/templates/${normalizedTemplateId}/${fileName}`,
    ];
    
    console.log(`[Template API Query] Checking ${possiblePaths.length} possible paths...`);
    
    let filePath: string | null = null;
    let foundPath: string | null = null;
    
    // Find the first existing path
    // Note: On Windows, path separators might be backslashes, but existsSync handles both
    for (const pathToCheck of possiblePaths) {
      try {
        // Normalize path separators for existsSync (works on both Windows and Linux)
        const normalizedPath = pathToCheck.replace(/\\/g, '/');
        // Try original path first (Windows might need backslashes)
        if (existsSync(pathToCheck)) {
          foundPath = pathToCheck;
          console.log(`[Template API Query] Found file at: ${foundPath}`);
          break;
        }
        // Also try normalized path (in case of mixed separators)
        if (pathToCheck !== normalizedPath && existsSync(normalizedPath)) {
          foundPath = normalizedPath;
          console.log(`[Template API Query] Found file at normalized path: ${foundPath}`);
          break;
        }
      } catch (pathError) {
        // Path might be invalid, continue to next
        console.log(`[Template API Query] Error checking path ${pathToCheck}:`, pathError);
      }
    }
    
    // If not found, use the primary path and let it fail with better error
    if (!foundPath) {
      filePath = possiblePaths[0];
      console.error(`[Template API Query] File does not exist at any of these paths:`);
      possiblePaths.forEach((p, i) => {
        const normalized = p.replace(/\\/g, '/');
        const exists = existsSync(normalized);
        console.error(`  ${i + 1}. ${normalized} ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
      });
      
      // Additional debug: Check if public/templates directory exists
      const publicTemplatesPath = join(process.cwd(), 'public', 'templates');
      const publicTemplatesExists = existsSync(publicTemplatesPath);
      console.error(`[Template API Query] public/templates directory exists: ${publicTemplatesExists}`);
      if (publicTemplatesExists) {
        try {
          const dirContents = readdirSync(publicTemplatesPath);
          console.error(`[Template API Query] Contents of public/templates:`, dirContents);
          
          // Check if the specific template directory exists (try both normalized and original)
          const templateDirPath = join(publicTemplatesPath, normalizedTemplateId);
          const templateDirPathOriginal = join(publicTemplatesPath, templateId);
          const templateDirExists = existsSync(templateDirPath) || existsSync(templateDirPathOriginal);
          console.error(`[Template API Query] Template directory "${normalizedTemplateId}" exists: ${existsSync(templateDirPath)}`);
          console.error(`[Template API Query] Template directory "${templateId}" exists: ${existsSync(templateDirPathOriginal)}`);
          if (templateDirExists) {
            const dirToRead = existsSync(templateDirPath) ? templateDirPath : templateDirPathOriginal;
            const templateDirContents = readdirSync(dirToRead);
            console.error(`[Template API Query] Contents of template directory:`, templateDirContents);
          }
        } catch (e) {
          console.error(`[Template API Query] Error reading public/templates:`, e);
        }
      }
      
      return NextResponse.json(
        { 
          error: `Template file not found: ${normalizedTemplateId}/${fileName}`, 
          templateId,
          normalizedTemplateId,
          fileType,
          triedPaths: possiblePaths.map(p => p.replace(/\\/g, '/')),
          cwd: process.cwd(),
          publicTemplatesExists,
          suggestion: 'Ensure template files exist in public/templates/[templateId]/ and restart dev server if needed'
        },
        { status: 404 }
      );
    }
    
    filePath = foundPath;
    console.log(`[Template API Query] Found file at: ${filePath}`);
    
    // Verify file exists one more time before reading (handles race conditions)
    if (!existsSync(filePath)) {
      console.error(`[Template API Query] File disappeared after finding it: ${filePath}`);
      return NextResponse.json(
        { 
          error: `Template file not accessible: ${templateId}/${fileName}`, 
          templateId,
          fileType,
          path: filePath
        },
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

