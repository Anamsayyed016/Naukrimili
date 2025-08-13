import { NextRequest, NextResponse } from 'next/server';

// Minimal Applications API so Apply page works end-to-end.
// Replace with real persistence (Prisma) later.

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ applications: [] });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const name = form.get('name')?.toString() || '';
      const email = form.get('email')?.toString() || '';
      const jobId = form.get('jobId')?.toString() || '';
      const file = form.get('file');
      const resumeFilename = typeof file === 'object' && file && 'name' in file ? (file as File).name : null;
      payload = { name, email, jobId, resumeFilename };
    } else {
      payload = await request.json();
    }

    const application = {
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      ...payload,
      status: 'pending',
    };

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 400 });
  }
}


