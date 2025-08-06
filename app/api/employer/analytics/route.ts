import { getServerSession } from 'next-auth';
import { handleApiError } from '@/lib/error-handler';

// Mock analytics data for demo purposes
const mockAnalytics = {
  stats: {
    totalViews: 1250,
    applications: 84,
    hireRate: '15%',
    topSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python']
  },
  trending: [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), views: 45 },
    { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), views: 52 },
    { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), views: 38 },
    { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), views: 67 },
    { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), views: 73 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), views: 89 },
    { date: new Date(), views: 92 }
  ],
  jobsBreakdown: [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      views: 432,
      applications: 28,
      status: 'ACTIVE'
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      views: 356,
      applications: 31,
      status: 'ACTIVE'
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      views: 267,
      applications: 15,
      status: 'PAUSED'
    },
    {
      id: '4',
      title: 'Product Manager',
      views: 195,
      applications: 10,
      status: 'CLOSED'
    }
  ]
};

export async function GET() {
  try {
    // Check if backend API is available for real data
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/employer/analytics`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const analytics = await response.json();
          return Response.json(analytics);
        }
      } catch (apiError) {
        // console.warn('Backend analytics API not available, using mock data');
      }
    }

    // Return mock data for demo
    return Response.json(mockAnalytics);

  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/employer/analytics',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}
