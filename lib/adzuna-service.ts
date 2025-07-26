// This is a placeholder service for Adzuna API integration
export interface JobStats {
  average_salary?: number;
  salary_min?: number;
  salary_max?: number;
  total_jobs?: number;
}

export class AdzunaService {
  static getJobStats(query: string): Promise<JobStats> {
    // Placeholder implementation
    return Promise.resolve({
      average_salary: 0,
      salary_min: 0,
      salary_max: 0,
      total_jobs: 0
    });
  }

  static searchJobs(query: string) {
    // Placeholder implementation
    return Promise.resolve([]);
  }

  static getRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          return `${diffInMinutes} minutes ago`;
        }
        return `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
      } else {
        const diffInMonths = Math.floor(diffInDays / 30);
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'recently';
    }
  }
}

export async function getJobStats(query: string): Promise<JobStats> {
  return AdzunaService.getJobStats(query);
}

export async function searchJobs(query: string) {
  return AdzunaService.searchJobs(query);
}

export default AdzunaService;
