import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Fetch job categories from the user's own FastAPI backend
    const res = await fetch('http://localhost:8000/categories');
    if (!res.ok) throw new Error('Failed to fetch categories from backend');
    const categories = await res.json();
    return Response.json({ categories });
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/categories',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}
