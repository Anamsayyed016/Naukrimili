import HomePageClient from './HomePageClient';
import { unstable_cache } from 'next/cache';
import type { HomePageJob, HomePageCompany } from '@/components/home/home-types';
// FORCE HASH CHANGE - Build timestamp: 2025-01-19 15:30:00

export const revalidate = 60;
export const runtime = 'nodejs';

async function fetchHomepageDataUncached(): Promise<{
  featuredJobs: HomePageJob[];
  topCompanies: HomePageCompany[];
}> {
  // Fetch featured jobs using the API endpoint for better reliability
  let featuredJobs: HomePageJob[] = [];
  let topCompanies: HomePageCompany[] = [];

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
      // CRITICAL: Skip database queries during build time
      // Check if we're in build mode (Next.js sets NEXT_PHASE during build)
      // Also check SKIP_BUILD_DB_QUERIES environment variable
      const skipDbQueries = process.env.SKIP_BUILD_DB_QUERIES === 'true' ||
                            process.env.SKIP_DB_QUERIES === 'true';
      const isBuildTime =
        process.env.NEXT_PHASE === 'phase-production-build' || skipDbQueries;
      
      if (isBuildTime || skipDbQueries) {
        console.log('⚠️ Build time detected, skipping database queries and using fallback data');
        // Use fallback data during build
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
            company: 'CloudOps',
            location: 'Bangalore, India',
            salary: '₹14,00,000 - ₹22,00,000',
            jobType: 'Full-time',
            isRemote: true,
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
        // CRITICAL: Skip database queries if SKIP_BUILD_DB_QUERIES is set
        if (process.env.SKIP_BUILD_DB_QUERIES === 'true' || process.env.SKIP_DB_QUERIES === 'true') {
          console.log('⚠️ SKIP_BUILD_DB_QUERIES is set, skipping all database queries');
          // Use fallback data - will be set below
        } else {
          // First try direct database access (faster)
          // Wrap in try-catch to handle build-time database unavailability
          // CRITICAL: Use dynamic import to prevent webpack from analyzing Prisma during build
          try {
            const { prisma } = await import('@/lib/prisma');
            const jobSelect = {
              id: true,
              sourceId: true,
              source: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              country: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              isFeatured: true,
              sector: true,
            } as const;

            const featuredQueryPromise = prisma.job.findMany({
              where: {
                isFeatured: true,
                isActive: true,
              },
              take: 6,
              orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
              select: jobSelect,
            });

            const companiesQueryPromise = prisma.company.findMany({
              where: { isActive: true },
              include: {
                _count: {
                  select: {
                    jobs: {
                      where: {
                        isActive: true,
                      },
                    },
                  },
                },
              },
              orderBy: [{ jobs: { _count: 'desc' } }, { createdAt: 'desc' }],
              take: 6,
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Database query timeout')), 10000)
            );

            const [featuredResult, companiesResult] = await Promise.allSettled([
              Promise.race([featuredQueryPromise, timeoutPromise]),
              companiesQueryPromise,
            ]);

            if (featuredResult.status === 'fulfilled') {
              featuredJobs = featuredResult.value.map((job) => ({
                id: job.id,
                sourceId: job.sourceId,
                source: job.source || 'database',
                title: job.title,
                company: job.company,
                companyLogo: job.companyLogo,
                location: job.location,
                country: job.country || 'IN',
                salary:
                  job.salary ||
                  (job.salaryMin && job.salaryMax
                    ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}`
                    : null),
                jobType: job.jobType,
                experienceLevel: job.experienceLevel,
                isRemote: job.isRemote,
                isFeatured: job.isFeatured,
                sector: job.sector,
              }));
              console.log(`✅ Fetched ${featuredJobs.length} featured jobs from database`);
            }

            if (companiesResult.status === 'fulfilled') {
              topCompanies = companiesResult.value.map((company) => ({
                id: company.id,
                name: company.name,
                logo: company.logo,
                website: company.website,
                location: company.location,
                industry: company.industry,
                sector: company.industry,
                isGlobal: false,
                jobCount: company._count.jobs,
              }));
            }
          } catch (dbError) {
            console.warn(
              '⚠️ Database connection failed during build (expected):',
              dbError instanceof Error ? dbError.message : 'Unknown error'
            );
          }
        }
      }
    }

      // If we have fewer than 6 featured jobs, use recent jobs from database
      if (featuredJobs.length < 6) {
        console.log(`🔧 Only ${featuredJobs.length} featured jobs, fetching recent jobs from database...`);
        
        try {
          // Only try database if we have DATABASE_URL (skip during build if unavailable)
          if (process.env.DATABASE_URL) {
            // CRITICAL: Use dynamic import to prevent webpack from analyzing Prisma during build
            const { prisma } = await import('@/lib/prisma');
            // Get recent jobs from database to fill the gap (already in database, no temporary IDs)
            const recentJobs = await prisma.job.findMany({
            where: {
              isActive: true,
              isFeatured: false // Get non-featured jobs to avoid duplicates
            },
            take: 6 - featuredJobs.length,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              sourceId: true,
              source: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              country: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              sector: true
            }
            });
            
            const recentJobsFormatted = recentJobs.map(job => ({
            id: job.id,
            sourceId: job.sourceId,
            source: job.source || 'database',
            title: job.title,
            company: job.company,
            companyLogo: job.companyLogo,
            location: job.location,
            country: job.country || 'IN',
            salary: job.salary || (job.salaryMin && job.salaryMax ? 
              `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            isRemote: job.isRemote,
            isFeatured: true, // Display as featured on homepage
            sector: job.sector
            }));
            
            featuredJobs = [...featuredJobs, ...recentJobsFormatted];
            console.log(`✅ Added ${recentJobsFormatted.length} recent jobs. Total: ${featuredJobs.length} featured jobs`);
          }
        } catch (recentJobsError) {
          console.warn('⚠️ Failed to fetch recent jobs from database:', recentJobsError instanceof Error ? recentJobsError.message : 'Unknown error');
          
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
        }
      }

    console.log(`📊 Homepage data loaded: ${featuredJobs.length} featured jobs, ${topCompanies.length} companies`);
  } catch (_error) {
    console.error('❌ Error loading homepage data:', _error);
    
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

  return { featuredJobs: featuredJobs || [], topCompanies: topCompanies || [] };
}

const getCachedHomepageData = unstable_cache(
  fetchHomepageDataUncached,
  ['homepage-featured-companies-v1'],
  { revalidate: 60, tags: ['homepage'] }
);

export default async function HomePage() {
  const { featuredJobs, topCompanies } = await getCachedHomepageData();

  return (
    <HomePageClient 
      featuredJobs={featuredJobs || []}
      topCompanies={topCompanies || []}
    />
  );
}
