import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const params = await context.params;
  try {
    const API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    // Fetch job details from the backend
    const res = await fetch(`${API_URL}/jobs/${params.jobId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 300 // Cache for 5 minutes
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch job details: ${res.status} - ${errorText}`);
    }

    const job = await res.json();
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ 
      error: error.message || 'Unable to fetch job details from backend.'
    }, { 
      status: error.message?.includes('not found') ? 404 : 500 
    });
  }
}
