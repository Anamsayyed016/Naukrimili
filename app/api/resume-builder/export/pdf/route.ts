/**
 * PDF Export API Route
 * Exports resume as PDF using Puppeteer
 * 
 * POST /api/resume-builder/export/pdf
 * 
 * Body:
 * {
 *   "templateId": "modern-professional",
 *   "formData": {...},
 *   "selectedColorId": "charcoal"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateExportHTML } from '@/lib/resume-builder/resume-export';

// Ensure Node.js runtime (not edge) for Puppeteer
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let puppeteer: any = null;
let puppeteerAvailable = false;

// Try to import Puppeteer, but don't fail if it's not available
try {
  puppeteer = require('puppeteer');
  puppeteerAvailable = true;
  console.log('✅ Puppeteer loaded successfully');
} catch (e: any) {
  console.warn('⚠️ Puppeteer not available:', e.message || e);
  puppeteerAvailable = false;
}

export async function POST(request: NextRequest) {
  let browser: any = null;
  
  try {
    const body = await request.json();
    const { templateId, formData, selectedColorId } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId and formData' },
        { status: 400 }
      );
    }

    console.log('📄 Generating PDF export:', { templateId, hasColor: !!selectedColorId, puppeteerAvailable });

    // Check if Puppeteer is available
    if (!puppeteer || !puppeteerAvailable) {
      console.error('❌ Puppeteer not available for PDF export');
      return NextResponse.json(
        { error: 'PDF generation service unavailable. Please use client-side export.', fallback: true },
        { status: 503 }
      );
    }

    // Generate the exact HTML used in live preview
    let html: string;
    try {
      console.log('📝 Generating HTML for export...');
      html = await generateExportHTML({
        templateId,
        formData,
        selectedColorId,
      });
      console.log('✅ HTML generated successfully, length:', html.length);
    } catch (htmlError: any) {
      console.error('❌ HTML generation failed:', htmlError.message || htmlError);
      return NextResponse.json(
        { 
          error: 'Failed to generate HTML for export', 
          details: htmlError.message || 'Unknown error',
          fallback: true
        },
        { status: 500 }
      );
    }

    // Launch Puppeteer browser with timeout and better error handling
    console.log('🚀 Launching Puppeteer browser...');
    const launchPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
      timeout: 30000,
    }).catch((launchError: any) => {
      console.error('❌ Puppeteer launch error:', launchError.message || launchError);
      throw new Error(`Failed to launch browser: ${launchError.message || 'Unknown error'}`);
    });

    // Add timeout for browser launch
    try {
      browser = await Promise.race([
        launchPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Browser launch timeout after 30 seconds')), 30000)
        )
      ]) as any;
      console.log('✅ Browser launched successfully');
    } catch (launchError: any) {
      console.error('❌ Browser launch failed:', launchError.message || launchError);
      throw new Error(`Browser launch failed: ${launchError.message || 'Unknown error'}`);
    }

    const page = await browser.newPage();
    console.log('📄 Page created, setting content...');

    // Set content with the generated HTML
    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
      console.log('✅ HTML content set successfully');
    } catch (contentError: any) {
      console.error('❌ Failed to set page content:', contentError.message || contentError);
      throw new Error(`Failed to set page content: ${contentError.message || 'Unknown error'}`);
    }

    // Wait for fonts and images to load
    await page.evaluateHandle(() => document.fonts.ready).catch(() => {
      // Ignore font loading errors
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with ATS-friendly settings
    console.log('📄 Generating PDF...');
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await page.pdf({
        format: 'Letter', // US Letter size (8.5 x 11 inches)
        printBackground: true, // Include background colors
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 30000,
      }) as Buffer;
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError: any) {
      console.error('❌ PDF generation failed:', pdfError.message || pdfError);
      throw new Error(`PDF generation failed: ${pdfError.message || 'Unknown error'}`);
    }

    await browser.close();
    browser = null;

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${templateId}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ PDF Export error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      puppeteerAvailable,
      hasBrowser: !!browser
    });
    
    // Clean up browser if it exists
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Browser closed after error');
      } catch (e) {
        console.warn('⚠️ Error closing browser:', e);
      }
    }

    // Return error with detailed information
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error.message || 'Unknown error',
        errorType: error.name || 'Error',
        fallback: true
      },
      { status: 500 }
    );
  }
}

