import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

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
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    return Response.json({ job });
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/[jobId]',
      context: {
        jobId: params.jobId,
        timestamp: new Date().toISOString()
      }
    });
  }
}
