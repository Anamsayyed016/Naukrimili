import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Mock Reed API test response
    const testData = {
      success: true,
      message: 'Reed API test endpoint',
      apiStatus: 'mock',
      timestamp: new Date().toISOString(),
      mockJobs: [
        {
          id: 'reed-1',
          title: 'Software Engineer',
          company: 'Tech Company UK',
          location: 'London, UK',
          salary: '£45,000 - £55,000',
          description: 'Exciting opportunity for a software engineer...',
          source: 'reed'
  // TODO: Complete function implementation
}
        },
        {
          id: 'reed-2',
          title: 'Data Analyst',
          company: 'Data Corp UK',
          location: 'Manchester, UK',
          salary: '£35,000 - £45,000',
          description: 'Looking for a skilled data analyst...',
          source: 'reed'
        }
      ]
    };

    return Response.json(testData)} catch (error) {
    console.error("Error:", error);
    throw error}
    return handleApiError(error, {
      endpoint: 'GET /api/test-reed',
      context: { timestamp: new Date().toISOString() }})}
}
