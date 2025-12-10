import { MetadataRoute } from 'next'

// Revalidate every hour
export const revalidate = 3600

// Dynamic rendering - CRITICAL: Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic'

// CRITICAL: Prevent build-time execution
export const runtime = 'nodejs'

// Dynamic import to avoid build-time issues
async function getPrismaClient() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return prisma
  } catch (error) {
    console.error('Prisma import failed:', error)
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://naukrimili.com'
  
  // Static routes with priorities and change frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resumes/upload`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  try {
    // Get Prisma client
    const prisma = await getPrismaClient()
    
    // If Prisma is not available, return static routes only
    if (!prisma) {
      console.log('Prisma not available, returning static routes only')
      return staticRoutes
    }

    // Fetch active jobs (limit to recent 10,000 for sitemap size)
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        sourceId: true,
        source: true,
        title: true,
        company: true,
        location: true,
        country: true,
        sector: true,
        experienceLevel: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000,
    })

    // Fetch companies with jobs
    const companies = await prisma.company.findMany({
      where: {
        jobs: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      take: 5000,
    })

    // Generate job URLs
    const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => {
      // Generate SEO-friendly slug
      const titleSlug = job.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100)
      
      const companySlug = job.company
        ? job.company
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50)
        : 'company'
      
      const locationSlug = job.location
        ? job.location
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50)
        : 'remote'

      const country = (job.country || 'IN').toLowerCase()
      const sector = job.sector
        ? job.sector
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : 'general'
      
      const experienceLevel = job.experienceLevel
        ? job.experienceLevel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : 'all-levels'

      // SEO URL format: /jobs/country/sector/experience/title-at-company-location
      const seoUrl = `${baseUrl}/jobs/${country}/${sector}/${experienceLevel}/${titleSlug}-at-${companySlug}-${locationSlug}`

      return {
        url: seoUrl,
        lastModified: job.updatedAt || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }
    })

    // Generate company URLs
    const companyRoutes: MetadataRoute.Sitemap = companies.map((company) => ({
      url: `${baseUrl}/companies/${company.id}`,
      lastModified: company.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Combine all routes
    return [...staticRoutes, ...jobRoutes, ...companyRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if database fails
    return staticRoutes
  }
}

