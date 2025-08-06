export const API_CONFIG = {
  BACKEND_URL: process.env.BACKEND_API_URL || 'http://localhost:8000',
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  CACHE_TIMES: {
    JOB_DETAILS: 300, // 5 minutes
    JOB_LIST: 60, // 1 minute
    SALARY_STATS: 3600, // 1 hour
  },
  ERROR_MESSAGES: {
    FETCH_FAILED: 'Failed to fetch data from backend',
    NOT_FOUND: 'Resource not found',
    INVALID_PARAMS: 'Invalid parameters provided',
    INTERNAL_ERROR: 'An internal server error occurred',
    RATE_LIMIT: 'Too many requests, please try again later',
  },
}
