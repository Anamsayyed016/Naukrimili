import HomePageClient from './HomePageClient';
import { prisma } from '@/lib/prisma';
// FORCE HASH CHANGE - Build timestamp: 2025-01-19 15:30:00

interface HomePageJob {
  id: number | string;
  sourceId?: string | null;
  source?: string;
  title: string;
  company: string | null;
  companyLogo?: string | null;
  location: string | null;
  country?: string;
  salary: string | null;
  jobType: string | null;
  experienceLevel?: string | null;
  isRemote: boolean;
  isFeatured: boolean;
  sector?: string | null;
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
      // Wrap in try-catch to handle build-time database unavailability
      try {
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
          sourceId: true, // CRITICAL: For URL generation
          source: true, // CRITICAL: For job type identification
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          country: true, // CRITICAL: For SEO URL and region validation
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          jobType: true,
          experienceLevel: true, // CRITICAL: For SEO URL
          isRemote: true,
          isFeatured: true,
          sector: true // CRITICAL: For SEO URL
        }
      });

      if (dbFeaturedJobs.length > 0) {
        featuredJobs = dbFeaturedJobs.map(job => ({
          id: job.id,
          sourceId: job.sourceId, // Include for URL generation
          source: job.source || 'database',
          title: job.title,
          company: job.company,
          companyLogo: job.companyLogo,
          location: job.location,
          country: job.country || 'IN', // Always include country
          salary: job.salary || (job.salaryMin && job.salaryMax ? 
            `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          isRemote: job.isRemote,
          isFeatured: job.isFeatured,
          sector: job.sector
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
              sourceId: job.sourceId, // Include for URL generation
              source: job.source || 'database',
              title: job.title,
              company: job.company,
              companyLogo: job.companyLogo,
              location: job.location,
              country: job.country || 'IN', // Always include country
              salary: job.salary,
              jobType: job.jobType,
              experienceLevel: job.experienceLevel,
              isRemote: job.isRemote,
              isFeatured: job.isFeatured,
              sector: job.sector
            }));
            console.log(`✅ Fetched ${featuredJobs.length} featured jobs from API`);
          }
        }
      }
      } catch (dbError) {
        // Database connection failed (expected during build) - use fallback
        console.warn('⚠️ Database connection failed during build (expected):', dbError instanceof Error ? dbError.message : 'Unknown error');
        // Continue with fallback data below
      }

      // If we have fewer than 6 featured jobs, use recent jobs from database
      if (featuredJobs.length < 6) {
        console.log(`🔧 Only ${featuredJobs.length} featured jobs, fetching recent jobs from database...`);
        
        try {
          // Only try database if we have DATABASE_URL (skip during build if unavailable)
          if (process.env.DATABASE_URL) {
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

      // Fetch top companies (companies with most jobs)
      try {
        // Only try database if we have DATABASE_URL (skip during build if unavailable)
        if (process.env.DATABASE_URL) {
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
        } else {
          // DATABASE_URL not available (build time) - use fallback
          console.log('⚠️ DATABASE_URL not available, using fallback companies');
        }
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

  return (
    <HomePageClient 
      featuredJobs={featuredJobs || []}
      topCompanies={topCompanies || []}
    />
  );
}
