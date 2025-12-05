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
import { generateExportHTML } from '@/lib/resume-builder/resume-export';

// Ensure Node.js runtime (not edge) for file operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const htmlForWord = html.replace(
      '<!DOCTYPE html>',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!DOCTYPE html>'
    );

    console.log('✅ [DOCX Export] Export ready, sending response');

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

