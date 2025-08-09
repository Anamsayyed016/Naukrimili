export interface DemoHeroData {
  headline: string;
  subheadline: string;
  image?: string;
}

export const getDemoHero = async (): Promise<DemoHeroData> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    headline: 'Experience the Future of Job Search',
    subheadline: 'AI-powered matching, instant resume analysis, and personalized career insights.',
    image: '/placeholder.svg',
  };
};

export interface DemoCTAData {
  text: string;
  button: string;
  link: string;
}

export const getDemoCTA = async (): Promise<DemoCTAData> => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    text: 'Ready to Transform Your Career?',
    button: 'Get Started Today',
    link: '/auth/register',
  };
};

export interface DemoFeaturedJobsData {
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
  }>;
}

export const getDemoFeaturedJobs = async (): Promise<DemoFeaturedJobsData> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    jobs: [
      { id: '1', title: 'Senior React Developer', company: 'TechCorp Inc.', location: 'San Francisco, CA' },
      { id: '2', title: 'Product Manager', company: 'InnovateCo', location: 'New York, NY' },
      { id: '3', title: 'UX Designer', company: 'DesignStudio', location: 'Austin, TX' },
    ],
  };
};

export interface DemoHowItWorksData {
  steps: Array<{
    title: string;
    description: string;
  }>;
}

export const getDemoHowItWorks = async (): Promise<DemoHowItWorksData> => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    steps: [
      { title: 'Create Profile', description: 'Sign up and create your professional profile with AI assistance.' },
      { title: 'AI Matching', description: 'Our AI analyzes your skills and matches you with relevant opportunities.' },
      { title: 'Apply Smart', description: 'Apply to jobs with one-click using your optimized profile.' },
      { title: 'Get Hired', description: 'Track applications and connect with employers seamlessly.' },
    ],
  };
};

export interface DemoStatsData {
  jobs: number;
  companies: number;
  users: number;
  hires: number;
}

export const getDemoStats = async (): Promise<DemoStatsData> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    jobs: 15420,
    companies: 2850,
    users: 48670,
    hires: 12340,
  };
};

export interface DemoTestimonialsData {
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    avatar?: string;
  }>;
}

export const getDemoTestimonials = async (): Promise<DemoTestimonialsData> => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    testimonials: [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Software Engineer',
        company: 'TechCorp',
        content: 'NaukriMili helped me find my dream job in just 2 weeks! The AI matching was incredibly accurate.',
        avatar: '/placeholder-user.jpg',
      },
      {
        id: '2',
        name: 'Michael Chen',
        role: 'Product Manager',
        company: 'InnovateCo',
        content: 'The resume analysis feature gave me insights I never knew I needed. Highly recommended!',
        avatar: '/placeholder-user.jpg',
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        role: 'UX Designer',
        company: 'DesignStudio',
        content: 'Amazing platform! The job recommendations were spot-on and the application process was seamless.',
        avatar: '/placeholder-user.jpg',
      },
    ],
  };
};
