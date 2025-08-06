import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();
    
    const newJob = {
      id: Date.now().toString(),
      ...jobData,
      companyId: 'company_123',
      status: 'active',
      createdAt: new Date().toISOString(),
      applications: 0
    };

    return Response.json({
      success: true,
      message: 'Job posted successfully',
      job: newJob
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: 'POST /api/company/jobs',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

export async function GET() {
  const jobs = [
    {
      id: '1',
      title: 'Frontend Developer',
      description: 'React developer needed',
      location: 'Mumbai',
      salary: '₹8-15 LPA',
      status: 'active',
      applications: 25,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ];

  return Response.json({
    success: true,
    jobs: jobs,
    total: jobs.length
  });
}