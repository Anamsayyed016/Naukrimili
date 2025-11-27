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

// Try to import Puppeteer, but don't fail if it's not available
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('⚠️ Puppeteer not available, PDF export will use client-side fallback');
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

    console.log('📄 Generating PDF export:', { templateId, hasColor: !!selectedColorId });

    // Check if Puppeteer is available
    if (!puppeteer) {
      return NextResponse.json(
        { error: 'PDF generation service unavailable. Please use client-side export.', fallback: true },
        { status: 503 }
      );
    }

    // Generate the exact HTML used in live preview
    const html = await generateExportHTML({
      templateId,
      formData,
      selectedColorId,
    });

    // Launch Puppeteer browser with timeout
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
      ],
    });

    // Add timeout for browser launch
    browser = await Promise.race([
      launchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Browser launch timeout')), 30000)
      )
    ]) as any;

    const page = await browser.newPage();

    // Set content with the generated HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts and images to load
    await page.evaluateHandle(() => document.fonts.ready).catch(() => {
      // Ignore font loading errors
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with ATS-friendly settings
    const pdfBuffer = await page.pdf({
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
    });

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
    
    // Clean up browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Return error with fallback flag
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error.message || 'Unknown error',
        fallback: true
      },
      { status: 500 }
    );
  }
}

