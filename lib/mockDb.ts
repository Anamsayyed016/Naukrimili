// Mock database for development and testing
export const mockDatabase = {
  jobs: [
    {
      id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp India',
      location: 'Bangalore, India',
      description: 'Looking for a skilled software engineer...',
      type: 'full-time',
      salary: {
        formatted: '₹15,00,000 - ₹25,00,000 PA',
      },
      status: 'published',
      posted_date: new Date().toISOString(),
    },
    // Add more mock jobs as needed
  ],
  users: [
    {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    },
  ],
};

// Mock database functions
export const mockDb = {
  findJobs: async (query = '') => {
    return mockDatabase.jobs.filter(job => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase())
    );
  },
  
  getJob: async (id: string) => {
    return mockDatabase.jobs.find(job => job.id === id);
  },

  getUser: async (id: string) => {
    return mockDatabase.users.find(user => user.id === id);
  },
};
