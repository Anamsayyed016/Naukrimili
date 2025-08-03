import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

// Mock system health data
const generateMockHealthData = () => {
  const now = new Date();
  const performanceHistory = [];
  
  // Generate 24 hours of mock performance data
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    performanceHistory.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.floor(Math.random() * 200) + 300, // 300-500ms
      errorRate: Math.random() * 2, // 0-2% error rate
      requestCount: Math.floor(Math.random() * 1000) + 500
    });
  }

  return {
    status: 'healthy' as const,
    metrics: {
      cpuUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
      memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      diskSpace: Math.floor(Math.random() * 15) + 65, // 65-80%
      responseTime: Math.floor(Math.random() * 100) + 350 // 350-450ms
    },
    services: [
      {
        name: 'Database',
        status: 'up' as const,
        uptime: 99.9,
        lastIncident: undefined
      },
      {
        name: 'Redis Cache',
        status: 'up' as const,
        uptime: 99.8,
        lastIncident: undefined
      },
      {
        name: 'Search Service',
        status: 'up' as const,
        uptime: 98.5,
        lastIncident: '2 days ago'
      },
      {
        name: 'Email Service',
        status: 'degraded' as const,
        uptime: 95.2,
        lastIncident: '6 hours ago'
      },
      {
        name: 'File Storage',
        status: 'up' as const,
        uptime: 99.9,
        lastIncident: undefined
      }
    ],
    performanceHistory
  };
};

export async function GET() {
  try {
    // Check if backend API is available for real health data
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/admin/system/health`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const healthData = await response.json();
          return NextResponse.json(healthData);
        }
      } catch (error) {
        console.warn('Backend health API not available, using mock data');
      }
    }

    // Return mock data
    const mockData = generateMockHealthData();
    return NextResponse.json(mockData);

  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/admin/system/health',
      context: { timestamp: new Date().toISOString() }
    });
  }
}
