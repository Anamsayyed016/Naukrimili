/**
 * DOCX Export API Route
 * Exports resume as DOCX by generating HTML that Word can open
 * 
 * POST /api/resume-builder/export/docx
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

// Ensure Node.js runtime (not edge) for file operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // DOCX EXPORT IS DISABLED - Return 403 immediately
    return NextResponse.json(
      { 
        error: 'DOCX export is currently disabled. Please use PDF export instead.',
        requiresPayment: false,
      },
      { status: 403 }
    );

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

    console.log('📄 [DOCX Export] Starting export:', { templateId, hasColor: !!selectedColorId });
    console.log('📄 [DOCX Export] FormData keys:', Object.keys(formData));

    // Generate the exact HTML used in live preview
    let html: string;
    try {
      console.log('📝 [DOCX Export] Generating HTML...');
      html = await generateExportHTML({
        templateId,
        formData,
        selectedColorId,
      });
      console.log('✅ [DOCX Export] HTML generated, length:', html.length);
    } catch (htmlError: any) {
      console.error('❌ [DOCX Export] HTML generation failed:', htmlError);
      return NextResponse.json(
        { error: 'Failed to generate HTML for export', details: htmlError.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // Convert HTML to Word-compatible format
    // Word can open HTML files and save as DOCX
    // This approach preserves formatting better than text extraction
    // Add Word-specific styles to preserve graphics
    const wordStyles = `
      <style>
        /* Word-specific styles to preserve graphics */
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Preserve background colors in Word */
        [style*="background"],
        [class*="bg-"],
        [class*="background"] {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Preserve images */
        img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
        }
        /* Preserve SVG */
        svg, svg * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      </style>
    `;
    
    // Inject Word styles before closing </head>
    const htmlForWord = html
      .replace('</head>', `${wordStyles}</head>`)
      .replace(
        '<!DOCTYPE html>',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!DOCTYPE html>'
      );

    console.log('✅ [DOCX Export] Export ready, sending response');

    // Deduct credits after successful DOCX generation
    try {
      const businessCheck = await checkBusinessSubscription(session.user.id);
      if (businessCheck.isActive && businessCheck.subscription) {
        // Business plan: deduct credits
        await deductResumeCredits({
          userId: session.user.id,
          credits: 1,
          reason: 'resume_download',
          description: 'DOCX download',
        });
      } else {
        // Individual plan: increment usage counter
        await incrementUsage(session.user.id, 'docxDownload');
      }
    } catch (creditError: any) {
      console.error('⚠️ [DOCX Export] Credit deduction failed:', creditError);
      // Don't fail the request if credit deduction fails
    }

    // Return HTML that Word can open (Word will convert to DOCX on save)
    return new NextResponse(htmlForWord, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword', // MIME type for Word documents
        'Content-Disposition': `attachment; filename="resume-${templateId}-${Date.now()}.doc"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ [DOCX Export] Export error:', error);
    console.error('❌ [DOCX Export] Error stack:', error.stack);

    return NextResponse.json(
      { error: 'Failed to generate DOCX', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

