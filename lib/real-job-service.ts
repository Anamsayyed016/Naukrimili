import axios from 'axios';

// Adzuna API Integration
export class AdzunaJobService {
  private readonly APP_ID = process.env.ADZUNA_APP_ID;
  private readonly API_KEY = process.env.ADZUNA_API_KEY;
  private readonly BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

  async searchJobs(query: string, location: string = 'india', page: number = 1) {
    try {
      const response = await axios.get(`${this.BASE_URL}/in/search/${page}`, {
        params: {
          app_id: this.APP_ID,
          app_key: this.API_KEY,
          what: query,
          where: location,
          results_per_page: 20,
          sort_by: 'relevance'
        }
      });

      return {
        jobs: response.data.results.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          salary: job.salary_min ? `₹${Math.round(job.salary_min/100000)}L - ₹${Math.round(job.salary_max/100000)}L` : 'Not specified',
          redirect_url: job.redirect_url,
          created: job.created,
          source: 'adzuna'
        })),
        total: response.data.count
      };
    } catch (error) {
      console.error('Adzuna API error:', error);
      throw error;
    }
  }
}

// Indeed API Integration (requires approval)
export class IndeedJobService {
  private readonly API_KEY = process.env.INDEED_API_KEY;
  
  async searchJobs(query: string, location: string) {
    // Indeed API implementation
    // Note: Indeed has restricted API access
  }
}

// Reed API Integration (UK focused)
export class ReedJobService {
  private readonly API_KEY = process.env.REED_API_KEY;
  private readonly BASE_URL = 'https://www.reed.co.uk/api/1.0/search';

  async searchJobs(query: string, location: string) {
    try {
      const response = await axios.get(this.BASE_URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.API_KEY + ':').toString('base64')}`
        },
        params: {
          keywords: query,
          location: location,
          resultsToTake: 20
        }
      });

      return {
        jobs: response.data.results.map((job: any) => ({
          id: job.jobId,
          title: job.jobTitle,
          company: job.employerName,
          location: job.locationName,
          description: job.jobDescription,
          salary: job.minimumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : 'Not specified',
          redirect_url: job.jobUrl,
          source: 'reed'
        })),
        total: response.data.totalResults
      };
    } catch (error) {
      console.error('Reed API error:', error);
      throw error;
    }
  }
}

// Unified Real Job Service
export class RealJobService {
  private adzuna = new AdzunaJobService();
  private reed = new ReedJobService();

  async searchJobs(query: string, location: string, page: number = 1) {
    const results = [];
    
    try {
      // Try Adzuna first (India focused)
      const adzunaResults = await this.adzuna.searchJobs(query, location, page);
      results.push(...adzunaResults.jobs);
    } catch (error) {
      console.warn('Adzuna API failed:', error);
    }

    try {
      // Try Reed for additional results
      const reedResults = await this.reed.searchJobs(query, location);
      results.push(...reedResults.jobs.slice(0, 10)); // Limit Reed results
    } catch (error) {
      console.warn('Reed API failed:', error);
    }

    return {
      jobs: results,
      total: results.length,
      sources: ['adzuna', 'reed']
    };
  }
}

export const realJobService = new RealJobService();