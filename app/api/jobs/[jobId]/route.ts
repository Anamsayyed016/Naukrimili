import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // Fetch job details from the user's own FastAPI backend
    const res = await fetch(`http://localhost:8000/jobs/${params.jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job details from backend');
    const job = await res.json();
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to fetch job details from backend.' }, { status: 500 });
  }
}
