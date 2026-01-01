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
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Admin bypass: Admins can download without payment
    const isAdmin = session.user.role === 'admin';
    if (isAdmin) {
      console.log('🔑 [PDF Export] Admin user detected - bypassing payment check');
    }

    // Check payment/credits before allowing download (skip for admins)
    if (!isAdmin) {
      const accessCheck = await checkResumeAccess(session.user.id, 'download');
      if (!accessCheck.allowed) {
        return NextResponse.json(
          { 
            error: accessCheck.reason || 'Download limit reached',
            requiresPayment: true,
            daysRemaining: accessCheck.daysRemaining,
            creditsRemaining: accessCheck.creditsRemaining,
          },
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    }

    const body = await request.json();
    const { templateId, formData, selectedColorId } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId and formData' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
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
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          }
        }
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
      
      // Validate HTML was generated
      if (!html || html.length === 0) {
        throw new Error('Generated HTML is empty');
      }
    } catch (htmlError: any) {
      console.error('❌ [PDF Export] HTML generation failed:', {
        message: htmlError.message,
        stack: htmlError.stack,
        templateId,
        hasFormData: !!formData,
      });
      return NextResponse.json(
        { 
          error: 'Failed to generate HTML for export', 
          details: htmlError.message || 'Unknown error',
          fallback: true
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
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

    // Set viewport to A4 dimensions (794x1123px at 96 DPI)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2, // Higher DPI for better quality
    });

    // Use 'screen' media type to match live preview exactly
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

    // Wait for all fonts to load (system fonts should load instantly, but ensure readiness)
    try {
      await page.evaluate(() => {
        return document.fonts.ready;
      });
      console.log('✅ Fonts ready');
    } catch (fontError) {
      console.warn('⚠️ Font loading check failed (non-critical):', fontError);
    }
    
    // Wait for all images to load and convert external URLs to base64 if needed
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      const imagePromises = images.map((img) => {
        // If already base64 or complete, resolve immediately
        if (img.complete && (img.src.startsWith('data:') || img.src.startsWith('blob:'))) {
          return Promise.resolve();
        }
        if (img.complete) {
          return Promise.resolve();
        }
        
        // Wait for image to load
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            resolve(); // Resolve after timeout to not block
          }, 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(); // Resolve even on error to not block
          };
        });
      });
      
      await Promise.all(imagePromises);
      
      // Convert external images to base64 for PDF compatibility
      for (const img of images) {
        if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:') && img.src.startsWith('http')) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              img.src = canvas.toDataURL('image/png');
            }
          } catch (e) {
            // If conversion fails, continue with original image
            console.warn('Image conversion failed:', e);
          }
        }
      }
    });
    
    // Wait for SVG rendering
    await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      svgs.forEach((svg) => {
        // Force SVG rendering
        svg.style.display = 'inline-block';
      });
    });
    
    // Additional wait to ensure all graphics are fully rendered
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Force multiple reflows to ensure all styles are applied
    await page.evaluate(() => {
      // Multiple reflows to catch all layout changes
      document.body.offsetHeight;
      document.body.scrollHeight;
      window.getComputedStyle(document.body);
      
      // Ensure all elements are laid out
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        (el as HTMLElement).offsetHeight;
      });
    });
    
    console.log('✅ All assets loaded and rendered');

    // Scale resume content to fit on single A4 page (1123px height)
    console.log('📐 Scaling content to fit on single page...');
    const scaleResult = await page.evaluate(() => {
      const container = document.querySelector('.resume-container') as HTMLElement;
      if (!container) {
        console.warn('Resume container not found');
        return { scale: 1, applied: false };
      }

      // Reset any existing transforms and styles
      container.style.transform = '';
      container.style.width = '';
      container.style.marginBottom = '';
      container.style.maxHeight = '';
      
      // Force layout recalculation to get accurate measurements
      const bodyElement = document.body;
      bodyElement.style.height = 'auto';
      bodyElement.style.overflow = 'visible';
      
      // Multiple forced reflows for accurate measurement
      void container.offsetHeight;
      void container.scrollHeight;
      void container.getBoundingClientRect();
      void bodyElement.offsetHeight;
      
      // Get actual content height - use the larger of scrollHeight or offsetHeight
      const containerRect = container.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
      
      // Use scrollHeight for accurate content measurement (includes overflow)
      const currentHeight = Math.max(
        container.scrollHeight, 
        container.offsetHeight,
        containerRect.height
      );
      
      const maxHeight = 1123; // A4 height in pixels (297mm at 96 DPI)
      const availableHeight = maxHeight - paddingTop - paddingBottom;

      console.log('Content height:', currentHeight, 'Max height:', maxHeight, 'Available:', availableHeight, 'Padding:', paddingTop, paddingBottom);

      // Only scale if content exceeds one page
      if (currentHeight > availableHeight) {
        // Calculate scale factor - use 92% to ensure content fits with margin
        const calculatedScale = availableHeight / currentHeight;
        const scale = Math.min(0.92, calculatedScale);
        
        console.log('Calculated scale:', scale, 'Would fit height:', currentHeight * scale);
        
        // Apply CSS transform scale to container
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top center';
        container.style.width = `${794 / scale}px`; // Adjust width so visual width stays 794px
        container.style.maxWidth = `${794 / scale}px`;
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
        
        // Compensate for height reduction to prevent extra blank space
        const heightReduction = currentHeight * (1 - scale);
        container.style.marginBottom = `-${heightReduction}px`;
        
        // Set body height to prevent extra pages
        bodyElement.style.height = `${maxHeight}px`;
        bodyElement.style.overflow = 'hidden';
        
        // Force reflow after scaling
        void container.offsetHeight;
        void container.scrollHeight;
        void container.getBoundingClientRect();
        
        console.log('Applied CSS scale:', scale, 'Scaled height:', currentHeight * scale, 'Height reduction:', heightReduction);
        return { scale, applied: true, originalHeight: currentHeight };
      }
      
      console.log('Content fits on one page, no scaling needed');
      return { scale: 1, applied: false, originalHeight: currentHeight };
    });

    console.log('📐 Scale result:', scaleResult);

    // Wait for scaling to apply and force layout recalculation
    await page.evaluate(() => {
      const container = document.querySelector('.resume-container') as HTMLElement;
      const bodyElement = document.body;
      if (container) {
        // Force multiple reflows to ensure transform is fully applied
        void container.offsetHeight;
        void container.scrollHeight;
        const rect = container.getBoundingClientRect();
        void rect.height;
        // Force style recalculation
        window.getComputedStyle(container).transform;
        window.getComputedStyle(bodyElement).height;
      }
    });
    
    // Wait for browser to fully apply the CSS transform and layout changes
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF with ATS-friendly settings (A4 format)
    console.log('📄 Generating PDF...');
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await page.pdf({
        format: 'A4', // A4 size (210mm x 297mm)
        printBackground: true, // Include background colors and graphics
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        preferCSSPageSize: false, // Use format: 'A4' instead
        displayHeaderFooter: false,
        timeout: 30000,
        scale: 1, // 100% scale - CSS transform handles scaling
      }) as Buffer;
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError: any) {
      console.error('❌ PDF generation failed:', pdfError.message || pdfError);
      throw new Error(`PDF generation failed: ${pdfError.message || 'Unknown error'}`);
    }

    await browser.close();
    browser = null;

    // Deduct credits after successful PDF generation (skip for admins)
    if (!isAdmin) {
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
    } else {
      console.log('🔑 [PDF Export] Admin user - skipping credit deduction');
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
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

