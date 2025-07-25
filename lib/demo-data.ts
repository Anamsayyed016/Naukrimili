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