/**
 * Job search functionality with local database and external fallback
 */

/**
 * Search for jobs using local API first, then fallback to external sources
 * @param {string} query - Search query for jobs
 * @param {Object} options - Additional search options
 * @param {string} options.location - Location filter
 * @param {string} options.jobType - Job type filter (full-time, part-time, etc.)
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of job listings
 */
export const searchJobs = async (query, options = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      q: query,
      ...options
    });
    
    // Try local database first
    const response = await fetch(`/api/jobs?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const localJobs = await response.json();
    
    // If we have local results, return them
    if (localJobs && localJobs.length > 0) {
      console.log(`Found ${localJobs.length} jobs in local database`);
      return localJobs;
    }
    
    // If no local results, offer external search
    console.log('No local jobs found, offering external search');
    return await handleExternalSearch(query, options);
    
  } catch (error) {
    console.error('Error searching jobs:', error);
    
    // Fallback to external search on error
    return await handleExternalSearch(query, options);
  }
};

/**
 * Handle external job search fallback
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Empty array (external search opens in new tab)
 */
const handleExternalSearch = async (query, options = {}) => {
  try {
    // Build Google Jobs search URL
    const location = options.location ? `+${options.location}` : '+near+me';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}+jobs${location}`;
    
    // Open external search in new tab
    window.open(searchUrl, '_blank');
    
    // Return empty array since external search is handled separately
    return [];
  } catch (error) {
    console.error('Error with external search:', error);
    return [];
  }
};

/**
 * Get job details by ID from local API
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} Job details or null if not found
 */
export const getJobById = async (jobId) => {
  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch job: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching job details:', error);
    return null;
  }
};

/**
 * Get featured/recommended jobs
 * @param {number} limit - Number of jobs to fetch
 * @returns {Promise<Array>} Array of featured jobs
 */
export const getFeaturedJobs = async (limit = 10) => {
  try {
    const response = await fetch(`/api/jobs/featured?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch featured jobs: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    return [];
  }
};

/**
 * Submit a job application
 * @param {string} jobId - Job ID
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} Application response
 */
export const applyForJob = async (jobId, applicationData) => {
  try {
    const response = await fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData)
    });
    
    if (!response.ok) {
      throw new Error(`Application failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error applying for job:', error);
    throw error;
  }
};

/**
 * Save a job to user's favorites
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Save response
 */
export const saveJob = async (jobId) => {
  try {
    const response = await fetch(`/api/jobs/${jobId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save job: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
};
