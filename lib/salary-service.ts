import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class SalaryService {
  async getSalaryStats(jobTitle: string, location?: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/salary-stats`, {
        params: {
          jobTitle,
          location,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching salary statistics:', error);
    throw error;
  }
}

  async searchJobs(query: string, location?: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/search`, {
        params: {
          query,
          location,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }
}

export const getSalaryService = () => new SalaryService();
