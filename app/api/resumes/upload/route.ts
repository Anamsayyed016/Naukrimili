import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ResumeService } from '@/lib/resume-service';

const resumeService = new ResumeService();

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
}

function getUserIdFromRequest(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'anonymous';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = (formData.get('resume') || formData.get('file')) as File | null;

    if (!resumeFile) {
      return NextResponse.json({ success: false, error: 'No resume file provided' }, { status: 400 });
    }

    const userId = getUserIdFromRequest(request);

    // Validate type/size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Upload PDF, DOC, DOCX, or TXT.' }, { status: 400 });
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Persist file to disk
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsRoot = path.join(process.cwd(), 'uploads', 'resumes', userId);
    await ensureDir(uploadsRoot);

    const ext = (() => {
      if (resumeFile.type === 'application/pdf') return 'pdf';
      if (resumeFile.type === 'application/msword') return 'doc';
      if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
      if (resumeFile.type === 'text/plain') return 'txt';
      return 'bin';
    })();

    const safeBase = (resumeFile.name || 'resume').replace(/[^a-z0-9_.-]/gi, '_');
    const fileName = `${Date.now()}_${safeBase}`;
    const filePath = path.join(uploadsRoot, fileName);

    await fs.writeFile(filePath, buffer);

    // Process file -> extract text + parse minimal structure
    const processing = await resumeService.processUploadedFile(
      // @ts-ignore File type in edge/runtime differs; we pass a shim object for parser fallbacks
      resumeFile as any,
      ext
    );

    // Save resume to database
    const saved = await resumeService.saveResume(userId, processing.parsedData, {
      uploadedFileName: resumeFile.name,
      fileSize: resumeFile.size,
      fileType: ext,
      processingConfidence: processing.confidence,
      storedPath: filePath,
    });

    // Analyze and persist analysis
    const analysis = await resumeService.analyzeResume(processing.parsedData, userId, saved.id);

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      resume: {
        id: saved.id,
        filename: resumeFile.name,
        storedPath: filePath,
        uploadedAt: new Date().toISOString(),
      },
      parsedData: processing.parsedData,
      analysis: analysis.analysis,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload/analyze resume', message: error.message }, { status: 500 });
  }
}