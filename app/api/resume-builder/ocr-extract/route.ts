/**
 * OCR Extract API Route
 * Extracts text and structured data from resume images using Google Cloud Vision OCR
 * 
 * POST /api/resume-builder/ocr-extract
 * 
 * Body:
 * {
 *   "imageBase64": "data:image/png;base64,..."
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleCloudOCRService } from '@/lib/services/google-cloud-ocr';

const ocrService = new GoogleCloudOCRService();

export async function POST(request: NextRequest) {
  try {
    if (!ocrService.isAvailable()) {
      return NextResponse.json(
        { error: 'OCR service not available. Please configure GOOGLE_CLOUD_OCR_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing required field: imageBase64' },
        { status: 400 }
      );
    }

    console.log('📄 OCR extraction requested');

    // Extract structured resume data
    const resumeData = await ocrService.extractResumeData(imageBase64);

    console.log('✅ OCR extraction completed:', {
      personalInfo: Object.keys(resumeData.personalInfo).length,
      experience: resumeData.experience.length,
      education: resumeData.education.length,
      skills: resumeData.skills.length,
      hasSummary: !!resumeData.summary,
    });

    return NextResponse.json({
      success: true,
      data: resumeData,
    });

  } catch (error: any) {
    console.error('❌ OCR extraction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract resume data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

