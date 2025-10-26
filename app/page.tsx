import HomePageClient from './HomePageClient';
import { prisma } from '@/lib/prisma';
// FORCE HASH CHANGE - Build timestamp: 2025-01-19 15:30:00

interface HomePageJob {
  id: number | string;
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
  sector?: string | null;
  isGlobal?: boolean;
  jobCount: number;
}

export default async function HomePage() {
  // Fetch featured jobs using the API endpoint for better reliability
  let featuredJobs: HomePageJob[] = [];
  let topCompanies: Company[] = [];

  try {
    // Check if DATABASE_URL is available (skip database calls during build if not)
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ DATABASE_URL not found, using fallback data for homepage');
      
      // Use fallback data when database is not available
      featuredJobs = [
        {
          id: 'fallback-1',
          title: 'Senior Software Engineer',
          company: 'TechCorp Solutions',
          location: 'Bangalore, India',
          salary: '₹15,00,000 - ₹25,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        },
        {
          id: 'fallback-2',
          title: 'Frontend Developer',
          company: 'InnovateLab',
          location: 'Mumbai, India',
          salary: '₹10,00,000 - ₹18,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'fallback-3',
          title: 'Data Scientist',
          company: 'DataFlow Inc',
          location: 'Hyderabad, India',
          salary: '₹12,00,000 - ₹20,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        },
        {
          id: 'fallback-4',
          title: 'Product Manager',
          company: 'CloudTech',
          location: 'Delhi, India',
          salary: '₹18,00,000 - ₹30,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'fallback-5',
          title: 'UI/UX Designer',
          company: 'Creative Studio',
          location: 'Pune, India',
          salary: '₹8,00,000 - ₹15,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'fallback-6',
          title: 'DevOps Engineer',
          company: 'FinTech Pro',
          location: 'Chennai, India',
          salary: '₹14,00,000 - ₹22,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        }
      ];
      
      topCompanies = [
        {
          id: 'techcorp-solutions',
          name: 'TechCorp Solutions',
          logo: 'https://img.icons8.com/color/96/000000/google-logo.png',
          location: 'Bangalore, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'innovate-lab',
          name: 'InnovateLab',
          logo: 'https://img.icons8.com/color/96/000000/microsoft.png',
          location: 'Mumbai, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'dataflow-inc',
          name: 'DataFlow Inc',
          logo: 'https://img.icons8.com/color/96/000000/amazon-web-services.png',
          location: 'Hyderabad, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'cloudtech',
          name: 'CloudTech',
          logo: 'https://img.icons8.com/color/96/000000/google-cloud.png',
          location: 'Delhi, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'creative-studio',
          name: 'Creative Studio',
          logo: 'https://img.icons8.com/color/96/000000/adobe-creative-cloud.png',
          location: 'Pune, India',
          industry: 'Design',
          sector: 'Design',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'fintech-pro',
          name: 'FinTech Pro',
          logo: 'https://img.icons8.com/color/96/000000/money-bag.png',
          location: 'Chennai, India',
          industry: 'Finance',
          sector: 'Finance',
          isGlobal: false,
          jobCount: 0
        }
      ];
    } else {
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

      // If we have fewer than 6 featured jobs, fetch external jobs to fill the gap
      if (featuredJobs.length < 6) {
        console.log(`🔧 Only ${featuredJobs.length} featured jobs found, fetching external jobs...`);
        
        try {
          // Import external job providers
          const { fetchFromAdzuna } = await import('@/lib/jobs/providers');
          const { fetchFromJSearch } = await import('@/lib/jobs/dynamic-providers');
          
          // Fetch external jobs in parallel
          const externalPromises = [
            fetchFromAdzuna('software engineer', 'in', 1).catch(err => {
              console.warn('⚠️ Adzuna API failed:', err.message);
              return [];
            }),
            fetchFromJSearch('developer', 'IN', 1).catch(err => {
              console.warn('⚠️ JSearch API failed:', err.message);
              return [];
            })
          ];
          
          const [adzunaJobs, jsearchJobs] = await Promise.all(externalPromises);
          const allExternalJobs = [...adzunaJobs, ...jsearchJobs];
          
          console.log(`📡 External APIs returned ${allExternalJobs.length} jobs (Adzuna: ${adzunaJobs.length}, JSearch: ${jsearchJobs.length})`);
          
          // Convert external jobs to our format and add to featured jobs
          const externalJobsFormatted = allExternalJobs.slice(0, 6 - featuredJobs.length).map((job: any, index: number) => ({
            id: `external-${Date.now()}-${index}` as string, // Generate unique ID for external jobs
            title: job.title || 'Software Developer',
            company: job.company || 'Tech Company',
            location: job.location || 'India',
            salary: job.salary || 'Competitive',
            jobType: job.jobType || 'full_time',
            isRemote: job.isRemote || false,
            isFeatured: true
          }));
          
          featuredJobs = [...featuredJobs, ...externalJobsFormatted];
          console.log(`✅ Added ${externalJobsFormatted.length} external jobs. Total: ${featuredJobs.length} featured jobs`);
          
        } catch (_error) {
          console.warn('⚠️ Failed to fetch external jobs:', error);
          
          // Use fallback data when everything fails
          if (featuredJobs.length === 0) {
            featuredJobs = [
              {
                id: 'fallback-db-1',
                title: 'Senior Software Engineer',
                company: 'TechCorp Solutions',
                location: 'Bangalore, India',
                salary: '₹15,00,000 - ₹25,00,000',
                jobType: 'Full-time',
                isRemote: false,
                isFeatured: true
              },
              {
                id: 'fallback-db-2',
                title: 'Frontend Developer',
                company: 'InnovateLab',
                location: 'Mumbai, India',
                salary: '₹10,00,000 - ₹18,00,000',
                jobType: 'Full-time',
                isRemote: true,
                isFeatured: true
              },
              {
                id: 'fallback-db-3',
                title: 'Data Scientist',
                company: 'DataFlow Inc',
                location: 'Hyderabad, India',
                salary: '₹12,00,000 - ₹20,00,000',
                jobType: 'Full-time',
                isRemote: false,
                isFeatured: true
              }
            ];
          }
          
          // Fallback: set some recent jobs as featured
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

          if (recentJobs.length > 0 && featuredJobs.length === 0) {
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

            console.log(`✅ Set ${featuredJobs.length} recent jobs as featured`);
          }
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
          sector: company.industry, // Use industry as sector fallback
          isGlobal: false, // Default to false (will be updated after migration)
          jobCount: company._count.jobs
        }));
      } catch (companyError) {
        console.error('❌ Error loading companies:', companyError);
        
        // Use fallback companies when database fails
        topCompanies = [
          {
            id: 'techcorp-solutions',
            name: 'TechCorp Solutions',
            logo: 'https://img.icons8.com/color/96/000000/google-logo.png',
            location: 'Bangalore, India',
            industry: 'Technology',
            sector: 'Technology',
            isGlobal: false,
            jobCount: 0
          },
          {
            id: 'innovate-lab',
            name: 'InnovateLab',
            logo: 'https://img.icons8.com/color/96/000000/microsoft.png',
            location: 'Mumbai, India',
            industry: 'Technology',
            sector: 'Technology',
            isGlobal: false,
            jobCount: 0
          },
          {
            id: 'dataflow-inc',
            name: 'DataFlow Inc',
            logo: 'https://img.icons8.com/color/96/000000/amazon-web-services.png',
            location: 'Hyderabad, India',
            industry: 'Technology',
            sector: 'Technology',
            isGlobal: false,
            jobCount: 0
          },
          {
            id: 'cloudtech',
            name: 'CloudTech',
            logo: 'https://img.icons8.com/color/96/000000/google-cloud.png',
            location: 'Delhi, India',
            industry: 'Technology',
            sector: 'Technology',
            isGlobal: false,
            jobCount: 0
          },
          {
            id: 'creative-studio',
            name: 'Creative Studio',
            logo: 'https://img.icons8.com/color/96/000000/adobe-creative-cloud.png',
            location: 'Pune, India',
            industry: 'Design',
            sector: 'Design',
            isGlobal: false,
            jobCount: 0
          },
          {
            id: 'fintech-pro',
            name: 'FinTech Pro',
            logo: 'https://img.icons8.com/color/96/000000/money-bag.png',
            location: 'Chennai, India',
            industry: 'Finance',
            sector: 'Finance',
            isGlobal: false,
            jobCount: 0
          }
        ];
      }
    }

    console.log(`📊 Homepage data loaded: ${featuredJobs.length} featured jobs, ${topCompanies.length} companies`);

  } catch (_error) {
    console.error('❌ Error loading homepage data:', error);
    
    // Final fallback - use sample data if everything fails
    if (featuredJobs.length === 0) {
      featuredJobs = [
        {
          id: 'final-fallback-1',
          title: 'Senior Software Engineer',
          company: 'TechCorp Solutions',
          location: 'Bangalore, India',
          salary: '₹15,00,000 - ₹25,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        },
        {
          id: 'final-fallback-2',
          title: 'Frontend Developer',
          company: 'InnovateLab',
          location: 'Mumbai, India',
          salary: '₹10,00,000 - ₹18,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'final-fallback-3',
          title: 'Data Scientist',
          company: 'DataFlow Inc',
          location: 'Hyderabad, India',
          salary: '₹12,00,000 - ₹20,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        },
        {
          id: 'final-fallback-4',
          title: 'Product Manager',
          company: 'CloudTech',
          location: 'Delhi, India',
          salary: '₹18,00,000 - ₹30,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'final-fallback-5',
          title: 'UI/UX Designer',
          company: 'Creative Studio',
          location: 'Pune, India',
          salary: '₹8,00,000 - ₹15,00,000',
          jobType: 'Full-time',
          isRemote: true,
          isFeatured: true
        },
        {
          id: 'final-fallback-6',
          title: 'DevOps Engineer',
          company: 'FinTech Pro',
          location: 'Chennai, India',
          salary: '₹14,00,000 - ₹22,00,000',
          jobType: 'Full-time',
          isRemote: false,
          isFeatured: true
        }
      ];
    }
    
    if (topCompanies.length === 0) {
      topCompanies = [
        {
          id: 'techcorp-solutions',
          name: 'TechCorp Solutions',
          logo: 'https://img.icons8.com/color/96/000000/google-logo.png',
          location: 'Bangalore, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'innovate-lab',
          name: 'InnovateLab',
          logo: 'https://img.icons8.com/color/96/000000/microsoft.png',
          location: 'Mumbai, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'dataflow-inc',
          name: 'DataFlow Inc',
          logo: 'https://img.icons8.com/color/96/000000/amazon-web-services.png',
          location: 'Hyderabad, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'cloudtech',
          name: 'CloudTech',
          logo: 'https://img.icons8.com/color/96/000000/google-cloud.png',
          location: 'Delhi, India',
          industry: 'Technology',
          sector: 'Technology',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'creative-studio',
          name: 'Creative Studio',
          logo: 'https://img.icons8.com/color/96/000000/adobe-creative-cloud.png',
          location: 'Pune, India',
          industry: 'Design',
          sector: 'Design',
          isGlobal: false,
          jobCount: 0
        },
        {
          id: 'fintech-pro',
          name: 'FinTech Pro',
          logo: 'https://img.icons8.com/color/96/000000/money-bag.png',
          location: 'Chennai, India',
          industry: 'Finance',
          sector: 'Finance',
          isGlobal: false,
          jobCount: 0
        }
      ];
    }
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
