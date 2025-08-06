import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class JobService {
  async searchJobs(query: string, location?: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/search`, {
        params: {
          query,
          location,
        }
      });
      return response.data} catch (error) {
      console.error('Error fetching jobs:', error);
      throw error}
  }

  async getJob(jobId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
      return response.data} catch (error) {
      console.error('Error fetching job details:', error);
      throw error}
  }
}

export const getJobService = () => new JobService();
