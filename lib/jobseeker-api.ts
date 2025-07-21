// Mock API for Job Seeker Dashboard

export async function getStats() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        applied: 12,
        views: 45,
        successRate: 25, // percent
        avgResponseTime: 3.2 // days
      });
    }, 400);
  });
}

export async function getApplications() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          company: 'Tech Corp',
          jobTitle: 'Frontend Developer',
          appliedDate: '2024-06-01',
          status: 'Interview',
          jobLink: '#',
        },
        {
          company: 'InnovateX',
          jobTitle: 'UI/UX Designer',
          appliedDate: '2024-05-28',
          status: 'Submitted',
          jobLink: '#',
        },
        {
          company: 'DataWorks',
          jobTitle: 'Data Analyst',
          appliedDate: '2024-05-25',
          status: 'Rejected',
          jobLink: '#',
        },
        {
          company: 'Cloudify',
          jobTitle: 'DevOps Engineer',
          appliedDate: '2024-05-20',
          status: 'Viewed',
          jobLink: '#',
        },
      ]);
    }, 500);
  });
}

export async function getRecommendations() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          title: 'LinkedIn Premium',
          description: 'Boost your profile visibility and connect with top recruiters.',
          link: 'https://linkedin.com/premium',
          icon: '🎓',
        },
        {
          title: 'Resume Review Service',
          description: 'Get expert feedback on your resume and land more interviews.',
          link: 'https://resumereview.com',
          icon: '📝',
        },
        {
          title: 'AI Job Matcher',
          description: 'Try our AI-powered job matching tool for personalized job recommendations.',
          link: '#',
          icon: '🤖',
        },
      ]);
    }, 400);
  });
} 