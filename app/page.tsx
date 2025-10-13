import HomePageClient from './HomePageClient';
import { prisma } from '@/lib/prisma';
// FORCE HASH CHANGE - Build timestamp: 2025-01-19 15:30:00

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
  // Fetch featured jobs using the API endpoint for better reliability
  let featuredJobs: Job[] = [];
  let topCompanies: Company[] = [];

  try {
    // First try direct database access (faster)
    const dbFeaturedJobs = await prisma.job.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      take: 6,
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        jobType: true,
        isRemote: true,
        isFeatured: true
      }
    });

    if (dbFeaturedJobs.length > 0) {
      featuredJobs = dbFeaturedJobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary || (job.salaryMin && job.salaryMax ? 
          `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
        jobType: job.jobType,
        isRemote: job.isRemote,
        isFeatured: job.isFeatured
      }));
      console.log(`✅ Fetched ${featuredJobs.length} featured jobs from database`);
    } else {
      // Fallback to API endpoint if database fails
      console.log('🔧 No featured jobs from database, trying API endpoint...');
      
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const featuredResponse = await fetch(`${baseUrl}/api/featured-jobs?limit=6`, {
        next: { revalidate: 60 } // Cache for 1 minute
      });

      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        if (featuredData.success && featuredData.jobs) {
          featuredJobs = featuredData.jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            jobType: job.jobType,
            isRemote: job.isRemote,
            isFeatured: job.isFeatured
          }));
          console.log(`✅ Fetched ${featuredJobs.length} featured jobs from API`);
        }
      }
    }

    // If still no featured jobs, set some recent jobs as featured
    if (featuredJobs.length === 0) {
      console.log('🔧 Setting recent jobs as featured...');
      
      const recentJobs = await prisma.job.findMany({
        where: {
          isActive: true
        },
        take: 6,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          jobType: true,
          isRemote: true,
          isFeatured: true
        }
      });

      if (recentJobs.length > 0) {
        const jobsToFeature = recentJobs.slice(0, 3);
        await prisma.job.updateMany({
          where: {
            id: { in: jobsToFeature.map(job => job.id) }
          },
          data: {
            isFeatured: true
          }
        });

        featuredJobs = jobsToFeature.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || (job.salaryMin && job.salaryMax ? 
            `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
          jobType: job.jobType,
          isRemote: job.isRemote,
          isFeatured: true
        }));

        console.log(`✅ Set ${featuredJobs.length} jobs as featured`);
      }
    }

    // Fetch top companies (companies with most jobs)
    try {
      const companiesWithJobs = await prisma.company.findMany({
        include: {
          _count: {
            select: {
              jobs: {
                where: {
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: {
          jobs: {
            _count: 'desc'
          }
        },
        take: 6
      });

      topCompanies = companiesWithJobs.map(company => ({
        id: company.id,
        name: company.name,
        logo: company.logo,
        location: company.location,
        industry: company.industry,
        jobCount: company._count.jobs
      }));
    } catch (companyError) {
      console.error('❌ Error loading companies:', companyError);
      topCompanies = [];
    }

    console.log(`📊 Homepage data loaded: ${featuredJobs.length} featured jobs, ${topCompanies.length} companies`);

  } catch (error) {
    console.error('❌ Error loading homepage data:', error);
    // Fallback to empty arrays if everything fails
    featuredJobs = [];
    topCompanies = [];
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
