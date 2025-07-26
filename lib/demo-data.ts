interface DemoHeroData {
  headline: string;
  subheadline: string;
  image?: string;
}

export const getDemoHero = async (): Promise<DemoHeroData> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    headline: "Experience the Future of Job Search",
    subheadline: "AI-powered matching, instant resume analysis, and personalized career insights.",
    image: "/placeholder.svg" // Using placeholder image from public directory
  };
};

interface DemoCTAData {
  text: string;
  button: string;
  link: string;
}

export const getDemoCTA = async (): Promise<DemoCTAData> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    text: "Ready to Transform Your Career?",
    button: "Get Started Today",
    link: "/auth/register"
  };
};

interface DemoFeaturedJobsData {
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
  }[];
}

export const getDemoFeaturedJobs = async (): Promise<DemoFeaturedJobsData> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 400));

  return {
    jobs: [
      {
        id: "1",
        title: "Senior React Developer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA"
      },
      {
        id: "2",
        title: "Product Manager",
        company: "InnovateCo",
        location: "New York, NY"
      },
      {
        id: "3",
        title: "UX Designer",
        company: "DesignStudio",
        location: "Austin, TX"
      }
    ]
  };
};

interface DemoHowItWorksData {
  steps: {
    title: string;
    description: string;
  }[];
}

export const getDemoHowItWorks = async (): Promise<DemoHowItWorksData> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    steps: [
      {
        title: "Create Profile",
        description: "Sign up and create your professional profile with AI assistance."
      },
      {
        title: "AI Matching",
        description: "Our AI analyzes your skills and matches you with relevant opportunities."
      },
      {
        title: "Apply Smart",
        description: "Apply to jobs with one-click using your optimized profile."
      },
      {
        title: "Get Hired",
        description: "Track applications and connect with employers seamlessly."
      }
    ]
  };
};

interface DemoStatsData {
  jobs: number;
  companies: number;
  users: number;
  hires: number;
}

export const getDemoStats = async (): Promise<DemoStatsData> => {
  // Simulating an API call delay
  await new Promise(resolve => setTimeout(resolve, 400));

  return {
    jobs: 15420,
    companies: 2850,
    users: 48670,
    hires: 12340
  };
};
