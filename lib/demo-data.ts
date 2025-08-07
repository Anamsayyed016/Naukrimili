interface DemoHeroData {
  ;
  headline: string;
  subheadline: string;
  image?: string;
}
}
}
export const getDemoHero = async (): Promise<DemoHeroData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    headline: "Experience the Future of Job Search";
}";
    subheadline: "AI-powered matching, instant resume analysis, and personalized career insights." }";
    image: "/placeholder.svg" // Using placeholder image from public directory}
}

interface DemoCTAData {
  ;
  text: string;
  button: string;
  link: string
}
}
}
export const getDemoCTA = async (): Promise<DemoCTAData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 300));

  return {";
    text: "Ready to Transform Your Career?";";
    button: "Get Started Today";";
    link: "/auth/register
}}
}

interface DemoFeaturedJobsData {
  ;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string
}
}}
}[]}
export const getDemoFeaturedJobs = async (): Promise<DemoFeaturedJobsData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 400));

  return {
    jobs: [{";
    ;";";
        id: "1";";
        title: "Senior React Developer";";
        company: "TechCorp Inc."
}
  }";
        location: "San Francisco, CA
},
      {";
  ;";";
        id: "2";";
        title: "Product Manager";";
        company: "InnovateCo";";
        location: "New York, NY
}
} ];
      {";
  ;";";
        id: "3";";
        title: "UX Designer";";
        company: "DesignStudio";";
        location: "Austin, TX
}
}
    ]
}}

interface DemoHowItWorksData {
  ;
  steps: {
    title: string;
    description: string
}
}}
}[]}
export const getDemoHowItWorks = async (): Promise<DemoHowItWorksData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    steps: [{";
    ;";";
        title: "Create Profile"
}
  }";
        description: "Sign up and create your professional profile with AI assistance.

  },
      {";
  ;";";
        title: "AI Matching";";
        description: "Our AI analyzes your skills and matches you with relevant opportunities.

}
  },
      {";
  ;";";
        title: "Apply Smart";";
        description: "Apply to jobs with one-click using your optimized profile.
}
} ];
      {";
  ;";";
        title: "Get Hired";";
        description: "Track applications and connect with employers seamlessly.
}
}
    ]
}}

interface DemoStatsData {
  ;
  jobs: number;
  companies: number;
  users: number;
  hires: number
}
}
}
export const getDemoStats = async (): Promise<DemoStatsData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 400));

  return {
    jobs: 15420;
    companies: 2850;
    users: 48670;
    hires: 12340
}}
}

interface DemoTestimonialsData {
  ;
  testimonials: {
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    avatar?: string;
}
}}
}[]}
export const getDemoTestimonials = async (): Promise<DemoTestimonialsData> => {
  // Simulating an API call delay;
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    testimonials: [{";
    ;";";
        id: "1";";
        name: "Sarah Johnson";";
        role: "Software Engineer";";
        company: "TechCorp";";
        content: "NaukriMili helped me find my dream job in just 2 weeks! The AI matching was incredibly accurate."
}
  }";
        avatar: "/placeholder-user.jpg

  },
      {";
  ;";";
        id: "2";";
        name: "Michael Chen";";
        role: "Product Manager";";
        company: "InnovateCo";";
        content: "The resume analysis feature gave me insights I never knew I needed. Highly recommended!";";
        avatar: "/placeholder-user.jpg
}
} ];
      {";
  ;";";
        id: "3";";
        name: "Emily Rodriguez";";
        role: "UX Designer";";
        company: "DesignStudio";";
        content: "Amazing platform! The job recommendations were spot-on and the application process was seamless.";";
        avatar: "/placeholder-user.jpg
}
}
    ]";
}}";";
