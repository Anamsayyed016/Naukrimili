import axios from 'axios';

const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const BASE_URL = 'https://api.adzuna.com/v1/api';

export class AdzunaService {
  static async searchJobs(params: {
    what?: string;
    where?: string;
    page?: number;
    results_per_page?: number;
  }) {
    try {
      const { what = '', where = 'in', page = 1, results_per_page = 20 } = params;
      const url = `${BASE_URL}/jobs/${where}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(what)}&results_per_page=${results_per_page}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      return { results: [], count: 0 };
    }
  }

  static async getSalaryStats(jobTitle: string, location: string = 'in') {
    try {
      const url = `${BASE_URL}/jobs/${location}/history?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(jobTitle)}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching salary stats:', error);
      throw error;
    }
  }
}

export async function getSalaryStats(jobTitle: string, location: string = 'in') {
  return AdzunaService.getSalaryStats(jobTitle, location);
}
