/**
 * HTML Export API Route
 * Returns the generated HTML for client-side PDF generation
 * 
 * POST /api/resume-builder/export/html
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, formData, selectedColorId } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId and formData' },
        { status: 400 }
      );
    }

    console.log('📄 Generating HTML export:', { templateId, hasColor: !!selectedColorId });

    // Generate the exact HTML used in live preview
    const html = await generateExportHTML({
      templateId,
      formData,
      selectedColorId,
    });

    // Return HTML for client-side processing
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ HTML Export error:', error);

    return NextResponse.json(
      { error: 'Failed to generate HTML', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

