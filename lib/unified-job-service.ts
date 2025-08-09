export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  source: string;
  url: string;
  postedDate: string;
}

export interface JobSearchResponse {
  jobs: UnifiedJob[];
  total: number;
  page: number;
  totalPages: number;
}

export class UnifiedJobService {
  private API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  async searchJobs(query: string, location?: string, page: number = 1): Promise<JobSearchResponse> {
    try {
      const mockJobs: UnifiedJob[] = [
        {
          id: 'job_001',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: location || 'Remote',
          salary: '$80,000 - $120,000',
          description: 'We are looking for a talented software engineer...',
          source: 'internal',
          url: '/jobs/job_001',
          postedDate: new Date().toISOString(),
        },
      ];

      return {
        jobs: mockJobs,
        total: mockJobs.length,
        page,
        totalPages: 1,
      };
    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Failed to search jobs');
    }
  }

  async getJobById(id: string): Promise<UnifiedJob | null> {
    try {
      return {
        id,
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'Remote',
        salary: '$80,000 - $120,000',
        description: 'Detailed job description...',
        source: 'internal',
        url: `/jobs/${id}`,
        postedDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get job error:', error);
      return null;
    }
  }
}

export const unifiedJobService = new UnifiedJobService();