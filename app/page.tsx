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
    // Fetch featured jobs using optimized search with caching
    const jobsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/optimized?limit=6&includeExternal=false&includeDatabase=true&includeSample=true&country=IN`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    const jobsData = await jobsResponse.json();
    
    // Fetch top companies with caching
    const companiesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/companies/public?limit=6`, {
      cache: 'force-cache',
      next: { revalidate: 600 } // Cache for 10 minutes
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
    'Marketing Manager',
    'Sales Representative',
    'Nurse',
    'Teacher',
    'Accountant'
  ];

  const popularLocations = [
    // India
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune',
    // USA
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle',
    // UAE
    'Dubai', 'Abu Dhabi', 'Sharjah',
    // UK
    'London', 'Manchester', 'Birmingham', 'Edinburgh'
  ];

  return (
    <HomePageClient 
      featuredJobs={featuredJobs || []}
      topCompanies={topCompanies || []}
      trendingSearches={trendingSearches || []}
      popularLocations={popularLocations || []}
    />
  );
}
