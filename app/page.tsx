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
  // Use static data instead of fetching during build to prevent build errors
  const featuredJobs: Job[] = [];
  const topCompanies: Company[] = [];

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
