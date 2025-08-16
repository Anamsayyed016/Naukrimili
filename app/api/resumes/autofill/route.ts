import { NextRequest, NextResponse } from 'next/server';
import { RealResumeService } from '@/lib/real-resume-service';
import { standardizeCandidateProfile } from '@/lib/resume/standardize';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const resumeService = new RealResumeService();
    let fileType = 'application/pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = file.type;
    if (file.type === 'application/msword') fileType = file.type;

    const text = await resumeService.extractTextFromFile(filepath, fileType);
    const extracted = await resumeService.analyzeResume(text);
    const profile = standardizeCandidateProfile(extracted);

    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    console.error('Autofill error:', e?.message || e);
    return NextResponse.json({ success: false, error: 'Failed to process resume' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';


