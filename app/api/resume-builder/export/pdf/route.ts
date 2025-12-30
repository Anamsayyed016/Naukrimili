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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { generateExportHTML } from '@/lib/resume-builder/resume-export';
import { checkResumeAccess } from '@/lib/middleware/payment-middleware';
import { incrementUsage, deductResumeCredits } from '@/lib/services/payment-service';
import { checkBusinessSubscription } from '@/lib/services/payment-service';

// Ensure Node.js runtime (not edge) for Puppeteer
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy load Puppeteer to avoid build-time resolution issues
async function getPuppeteer() {
  try {
    const puppeteer = await import('puppeteer');
    return puppeteer.default || puppeteer;
  } catch (e: any) {
    console.warn('⚠️ Puppeteer not available:', e.message || e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  let browser: any = null;
  
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check payment/credits before allowing download
    const accessCheck = await checkResumeAccess(session.user.id, 'download');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { 
          error: accessCheck.reason || 'Download limit reached',
          requiresPayment: true,
          daysRemaining: accessCheck.daysRemaining,
          creditsRemaining: accessCheck.creditsRemaining,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { templateId, formData, selectedColorId } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId and formData' },
        { status: 400 }
      );
    }

    console.log('📄 [PDF Export] Starting export:', { templateId, hasColor: !!selectedColorId });
    console.log('📄 [PDF Export] FormData keys:', Object.keys(formData));

    // Lazy load Puppeteer
    const puppeteer = await getPuppeteer();
    if (!puppeteer) {
      console.warn('⚠️ [PDF Export] Puppeteer not available, returning fallback response');
      return NextResponse.json(
        { error: 'PDF generation service unavailable. Using browser print instead.', fallback: true },
        { status: 503 }
      );
    }

    // Generate the exact HTML used in live preview
    let html: string;
    try {
      console.log('📝 [PDF Export] Generating HTML...');
      html = await generateExportHTML({
        templateId,
        formData,
        selectedColorId,
      });
      console.log('✅ [PDF Export] HTML generated, length:', html.length);
    } catch (htmlError: any) {
      console.error('❌ [PDF Export] HTML generation failed:', htmlError.message || htmlError);
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

    // Use 'screen' media type to match live preview exactly
    // PDF generation will handle print styles via page.pdf() options
    await page.emulateMediaType('screen');
    
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
    
    // Wait for all images to load and convert to base64 if needed
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete && img.src.startsWith('data:')) {
            return Promise.resolve(); // Already base64
          }
          if (img.complete) {
            return Promise.resolve(); // Already loaded
          }
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to not block
            setTimeout(resolve, 3000); // Timeout after 3 seconds
          });
        })
      );
    });
    
    // Additional wait to ensure all graphics are rendered
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Force reflow to ensure all styles are applied
    await page.evaluate(() => {
      document.body.offsetHeight; // Force reflow
    });

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

    // Deduct credits after successful PDF generation
    try {
      const businessCheck = await checkBusinessSubscription(session.user.id);
      if (businessCheck.isActive && businessCheck.subscription) {
        // Business plan: deduct credits
        await deductResumeCredits({
          userId: session.user.id,
          credits: 1,
          reason: 'resume_download',
          description: 'PDF download',
        });
      } else {
        // Individual plan: increment usage counter
        await incrementUsage(session.user.id, 'pdfDownload');
      }
    } catch (creditError: any) {
      console.error('⚠️ [PDF Export] Credit deduction failed:', creditError);
      // Don't fail the request if credit deduction fails
    }

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

