import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

// Mock job data as fallback
const mockJob = {
  id: '1',
  title: 'Software Developer',
  company: 'Tech Solutions',
  location: 'Mumbai, India',
  description: 'We are looking for a skilled software developer to join our team. You will be responsible for developing and maintaining web applications using modern technologies.',
  salary: '₹8-15 LPA',
  jobType: 'Full-time',
  experience: '2-5 years',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  requirements: [
    'Bachelor\'s degree in Computer Science or related field',
    '2+ years of experience in web development',
    'Strong knowledge of JavaScript and modern frameworks',
    'Experience with database design and optimization'
  ],
  benefits: [
    'Competitive salary',
    'Health insurance',
    'Flexible working hours',
    'Professional development opportunities'
  ],
  posted: '2024-01-15',
  deadline: '2024-02-15'
};

export async function GET(request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const params = await context.params;
  try {
    // Try to fetch from backend first
    try {
      const API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${API_URL}/jobs/${params.jobId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: {
          revalidate: 300 // Cache for 5 minutes
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const job = await res.json();
        if (job) {
          return Response.json({ job });
        }
      }
    } catch (backendError) {
      // console.warn('Backend not available for job details, using mock data:', backendError);
    }
    
    // Fallback to mock data with the requested ID
    const fallbackJob = { ...mockJob, id: params.jobId };
    return Response.json({ job: fallbackJob });
    
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
