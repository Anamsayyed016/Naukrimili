import axios from 'axios';

const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const BASE_URL = 'https://api.adzuna.com/v1/api';

export async function getSalaryStats(jobTitle: string, location: string = 'in') {
  try {
    const url = `${BASE_URL}/jobs/${location}/history?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(jobTitle)}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching salary stats:', error);
    throw error;
  }
}
