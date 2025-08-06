import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SERPAPI_BASE_URL = process.env.SERPAPI_BASE_URL || 'https://serpapi.com/search';
const SERPAPI_KEY = process.env.SERPAPI_KEY || 'demo-key';

export class SearchService {
  async searchJobs(query: string, filters?: Record<string, unknown>) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/search`, {
        params: {
          query,
          ...filters
        }
      });
      return response.data} catch (error) {
      console.error('Error searching jobs:', error);
      throw error}
  }
}

export async function getJobDetails(jobId: string) {
  try {
  // TODO: Complete function implementation
}
    const response = await axios.get(`${SERPAPI_BASE_URL}/jobs/${jobId}`, {
      params: {
        api_key: SERPAPI_KEY,
      },
    });
    return response.data} catch (error) {
    console.error('Error fetching job details from SerpApi:', error);
    throw error}
}
