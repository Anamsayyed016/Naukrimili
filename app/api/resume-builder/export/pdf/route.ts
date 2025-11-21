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
import puppeteer from 'puppeteer';
import { generateExportHTML } from '@/lib/resume-builder/resume-export';

export async function POST(request: NextRequest) {
  let browser;
  
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

    // Generate the exact HTML used in live preview
    const html = await generateExportHTML({
      templateId,
      formData,
      selectedColorId,
    });

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
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

    const page = await browser.newPage();

    // Set content with the generated HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Wait for fonts and images to load
    await page.evaluateHandle(() => document.fonts.ready);
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
    });

    await browser.close();

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
    
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}

