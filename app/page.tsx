import Link from 'next/link';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle, Sparkles, Globe, Award, Clock, UserCheck, Building2, BriefcaseIcon } from 'lucide-react';
import HomePageClient from './HomePageClient';

interface Job {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  isRemote: boolean;
  isFeatured: boolean;
}

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
  industry?: string | null;
  jobCount: number;
}

export default async function HomePage() {
  // Fetch data server-side
  let featuredJobs: Job[] = [];
  let topCompanies: Company[] = [];
  
  try {
    // Fetch featured jobs
    const jobsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/unified?limit=6&includeExternal=true`, {
      cache: 'no-store'
    });
    const jobsData = await jobsResponse.json();
    
    // Fetch top companies
    const companiesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/companies?limit=6`, {
      cache: 'no-store'
    });
    const companiesData = await companiesResponse.json();

    if (jobsData.success) {
      featuredJobs = jobsData.jobs;
    }
    
    if (companiesData.success) {
      topCompanies = companiesData.companies;
    }
  } catch (error) {
    console.error('Error fetching home data:', error);
  }

  const trendingSearches = [
    'Software Engineer',
    'Data Analyst',
    'Product Manager',
    'UI/UX Designer',
    'DevOps Engineer',
    'Marketing Manager'
  ];

  const popularLocations = [
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune'
  ];

  return (
    <HomePageClient 
      featuredJobs={featuredJobs}
      topCompanies={topCompanies}
      trendingSearches={trendingSearches}
      popularLocations={popularLocations}
    />
  );
}
