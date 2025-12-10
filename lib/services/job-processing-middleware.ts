/**
 * Job Processing Middleware
 * Integrates normalization, categorization, and ranking into the job pipeline
 */

import { prisma } from '@/lib/prisma';
import { JobNormalizationService, NormalizedJobData } from './job-normalization-service';
import { JobCategorizationService } from './job-categorization-service';
import { JobRankingService } from './job-ranking-service';
import { Prisma } from '@prisma/client';

export interface ProcessedJobResult {
  jobs: Array<Record<string, unknown>>;
  totalJobs: number;
  sources: {
    database: number;
    external: number;
    sample: number;
  };
  processingTime: number;
  duplicatesRemoved: number;
  categories: string[];
}

export interface JobProcessingOptions {
  query?: string;
  location?: string;
  userId?: string;
  includeExternal?: boolean;
  includeDatabase?: boolean;
  includeSample?: boolean;
  limit?: number;
  page?: number;
  rankingWeights?: Record<string, number>;
}

export class JobProcessingMiddleware {
  private static instance: JobProcessingMiddleware;
  private normalizer: JobNormalizationService;
  private categorizer: JobCategorizationService;
  private ranker: JobRankingService;

  public static getInstance(): JobProcessingMiddleware {
    if (!JobProcessingMiddleware.instance) {
      JobProcessingMiddleware.instance = new JobProcessingMiddleware();
    }
    return JobProcessingMiddleware.instance;
  }

  constructor() {
    this.normalizer = JobNormalizationService.getInstance();
    this.categorizer = JobCategorizationService.getInstance();
    this.ranker = JobRankingService.getInstance();
  }

  /**
   * Process jobs through the complete pipeline
   */
  async processJobs(options: JobProcessingOptions = {}): Promise<ProcessedJobResult> {
    const startTime = Date.now();
    const {
      query = '',
      location = '',
      userId,
      includeExternal = true,
      includeDatabase = true,
      includeSample = true,
      limit = 200,
      page = 1
    } = options;

    console.log(`🚀 Job Processing Pipeline: Starting with options:`, {
      query, location, userId, includeExternal, includeDatabase, includeSample, limit, page
    });

    const allJobs: Array<Record<string, unknown>> = [];
    const sources = { database: 0, external: 0, sample: 0 };
    const categories: string[] = [];
    let duplicatesRemoved = 0;

    // 1. Get database jobs
    if (includeDatabase) {
      try {
        const dbJobs = await this.getDatabaseJobs(query, location, limit);
        allJobs.push(...dbJobs);
        sources.database = dbJobs.length;
        console.log(`✅ Database: Found ${dbJobs.length} jobs`);
      } catch (error) {
        console.error('❌ Database search failed:', error);
      }
    }

    // 2. Get external jobs and process them
    if (includeExternal) {
      try {
        const externalJobs = await this.getExternalJobs(query, location, limit);
        const processedExternalJobs = await this.processExternalJobs(externalJobs);
        allJobs.push(...processedExternalJobs.jobs);
        sources.external = processedExternalJobs.jobs.length;
        duplicatesRemoved += processedExternalJobs.duplicatesRemoved;
        console.log(`✅ External: Processed ${processedExternalJobs.jobs.length} jobs, removed ${processedExternalJobs.duplicatesRemoved} duplicates`);
      } catch (error) {
        console.error('❌ External job processing failed:', error);
      }
    }

    // 3. Generate sample jobs if needed
    if (includeSample && allJobs.length < limit) {
      try {
        const sampleJobs = await this.generateSampleJobs(query, location, limit - allJobs.length);
        allJobs.push(...sampleJobs);
        sources.sample = sampleJobs.length;
        console.log(`✅ Sample: Generated ${sampleJobs.length} sample jobs`);
      } catch (error) {
        console.error('❌ Sample job generation failed:', error);
      }
    }

    // 4. Categorize all jobs
    const categorizedJobs = await this.categorizeJobs(allJobs);
    const uniqueCategories = [...new Set(categorizedJobs.map(job => job.category))];
    categories.push(...uniqueCategories);

    // 5. Rank jobs
    const rankedJobs = await this.ranker.rankJobs(categorizedJobs, query, location, userId, options.rankingWeights);

    // 6. Apply pagination
    const skip = (page - 1) * limit;
    const paginatedJobs = rankedJobs.slice(skip, skip + limit);

    // 7. Convert back to original format for API compatibility
    const finalJobs = paginatedJobs.map(rankedJob => {
      const job = categorizedJobs.find(j => j.id === rankedJob.jobId);
      return {
        ...job,
        relevanceScore: rankedJob.score,
        rankingBreakdown: rankedJob.breakdown
      };
    });

    const processingTime = Date.now() - startTime;

    console.log(`✅ Job Processing Complete:`, {
      totalJobs: finalJobs.length,
      processingTime: `${processingTime}ms`,
      duplicatesRemoved,
      categories: uniqueCategories
    });

    return {
      jobs: finalJobs,
      totalJobs: allJobs.length,
      sources,
      processingTime,
      duplicatesRemoved,
      categories: uniqueCategories
    };
  }

  /**
   * Get jobs from database
   */
  private async getDatabaseJobs(query: string, location: string, limit: number): Promise<Array<Record<string, unknown>>> {
    const where: Prisma.JobWhereInput = { isActive: true };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const jobs = await prisma.job.findMany({
      where,
      take: limit,
      include: {
        companyRelation: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs;
  }

  /**
   * Get external jobs from APIs
   */
  private async getExternalJobs(query: string, location: string, limit: number): Promise<Array<Record<string, unknown>>> {
    // Import external job providers
    const { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } = await import('@/lib/jobs/providers');
    
    const externalJobs: Array<Record<string, unknown>> = [];
    const countries = ['IN', 'US', 'AE', 'GB']; // Main target countries
    const jobsPerCountry = Math.ceil(limit / countries.length);

    for (const country of countries) {
      try {
        const countryJobs = await Promise.all([
          fetchFromAdzuna(query, country.toLowerCase(), 1),
          fetchFromJSearch(query, country, 1),
          fetchFromGoogleJobs(query, country, 1),
          fetchFromJooble(query, country.toLowerCase(), 1)
        ]);

        const flatJobs = countryJobs.flat();
        externalJobs.push(...flatJobs.slice(0, jobsPerCountry));
      } catch (error) {
        console.warn(`⚠️ External job fetch failed for ${country}:`, error);
      }
    }

    return externalJobs.slice(0, limit);
  }

  /**
   * Process external jobs through normalization and duplicate detection
   */
  private async processExternalJobs(externalJobs: Array<Record<string, unknown>>): Promise<{ jobs: Array<Record<string, unknown>>; duplicatesRemoved: number }> {
    const processedJobs: Array<Record<string, unknown>> = [];
    let duplicatesRemoved = 0;

    for (const rawJob of externalJobs) {
      try {
        // Normalize the job
        const normalizedJob = await this.normalizer.normalizeJob(rawJob, 'external');
        
        // Check for duplicates
        const duplicateResult = await this.normalizer.detectDuplicates(normalizedJob);
        
        if (duplicateResult.isDuplicate) {
          duplicatesRemoved++;
          console.log(`🔄 Duplicate detected: ${normalizedJob.title} at ${normalizedJob.company}`);
          continue;
        }

        // Store in database if not duplicate
        const storedJob = await this.storeJobInDatabase(normalizedJob);
        processedJobs.push(storedJob as Record<string, unknown>);

      } catch (error) {
        console.error('❌ Failed to process external job:', error);
      }
    }

    return { jobs: processedJobs, duplicatesRemoved };
  }

  /**
   * Store normalized job in database
   */
  private async storeJobInDatabase(normalizedJob: NormalizedJobData): Promise<Prisma.JobGetPayload<{ include: { companyRelation: { select: { name: true; logo: true; location: true; industry: true } } } }>> {
    try {
      const job = await prisma.job.create({
        data: {
          source: normalizedJob.source,
          sourceId: normalizedJob.source_id,
          title: normalizedJob.title,
          company: normalizedJob.company,
          location: normalizedJob.location,
          country: normalizedJob.country,
          description: normalizedJob.description,
          requirements: normalizedJob.requirements,
          applyUrl: normalizedJob.apply_url,
          source_url: normalizedJob.source_url,
          postedAt: normalizedJob.posted_date,
          salary: normalizedJob.salary.display,
          salaryMin: normalizedJob.salary.min,
          salaryMax: normalizedJob.salary.max,
          salaryCurrency: normalizedJob.salary.currency,
          jobType: normalizedJob.type,
          experienceLevel: normalizedJob.experience_level,
          skills: JSON.stringify(normalizedJob.skills),
          isRemote: normalizedJob.is_remote,
          isHybrid: normalizedJob.is_hybrid,
          isUrgent: normalizedJob.is_urgent,
          isFeatured: normalizedJob.is_featured,
          isActive: true,
          sector: normalizedJob.category,
          rawJson: normalizedJob.raw_data
        },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true
            }
          }
        }
      });

      return job;
    } catch (error) {
      console.error('❌ Failed to store job in database:', error);
      throw error;
    }
  }

  /**
   * Categorize jobs
   */
  private async categorizeJobs(jobs: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
    const categorizedJobs = [];

    for (const job of jobs) {
      try {
        const categorization = await this.categorizer.categorizeJob(
          job.title || '',
          job.description || '',
          job.company || '',
          job.skills ? JSON.parse(job.skills) : []
        );

        categorizedJobs.push({
          ...job,
          category: categorization.category,
          subcategories: categorization.subcategories,
          categoryConfidence: categorization.confidence,
          matchedKeywords: categorization.keywords
        });
      } catch (error) {
        console.error('❌ Failed to categorize job:', error);
        categorizedJobs.push({
          ...job,
          category: 'General',
          subcategories: [],
          categoryConfidence: 0,
          matchedKeywords: []
        });
      }
    }

    return categorizedJobs;
  }

  /**
   * Generate sample jobs
   */
  private async generateSampleJobs(query: string, location: string, count: number): Promise<Array<Record<string, unknown>>> {
    const companies = [
      'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
      'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio'
    ];

    const jobTitles = [
      'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
      'QA Engineer', 'Business Analyst', 'Marketing Manager', 'Sales Executive'
    ];

    const sampleJobs: Array<Record<string, unknown>> = [];

    for (let i = 0; i < count; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const finalTitle = query ? `${query} ${title}` : title;

      sampleJobs.push({
        id: `sample-${Date.now()}-${i}`,
        title: finalTitle,
        company: company,
        location: location || 'Remote',
        description: `This is a comprehensive job description for ${finalTitle} at ${company}.`,
        jobType: 'Full-time',
        experienceLevel: 'Mid Level',
        salary: `$${Math.floor(Math.random() * 50000) + 30000} - $${Math.floor(Math.random() * 50000) + 80000}`,
        isRemote: Math.random() > 0.5,
        isFeatured: Math.random() > 0.8,
        category: 'Technology',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        source: 'sample'
      });
    }

    return sampleJobs;
  }
}
