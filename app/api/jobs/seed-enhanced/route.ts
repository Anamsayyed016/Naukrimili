/**
 * Enhanced Job Seeding API
 * Creates a large number of realistic jobs across multiple sectors
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { upsertNormalizedJob } from '@/lib/jobs/upsertJob';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const {
      totalJobs = 1000,
      sectors = 'all',
      includeRemote = true,
      includeHybrid = true,
      includeUrgent = true,
      includeFeatured = true
    } = body;

    console.log(`🌱 Starting enhanced job seeding: ${totalJobs} jobs`);
    console.log(`📊 Sectors: ${sectors === 'all' ? 'all' : sectors}`);
    console.log(`🏠 Remote: ${includeRemote}, Hybrid: ${includeHybrid}`);
    console.log(`⭐ Urgent: ${includeUrgent}, Featured: ${includeFeatured}`);

    const jobsToCreate = generateRealisticJobs({
      totalJobs,
      sectors,
      includeRemote,
      includeHybrid,
      includeUrgent,
      includeFeatured
    });

    console.log(`📝 Generated ${jobsToCreate.length} realistic jobs`);

    // Create jobs in batches to avoid memory issues
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < jobsToCreate.length; i += batchSize) {
      batches.push(jobsToCreate.slice(i, i + batchSize));
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} jobs)`);

      for (const job of batch) {
        try {
          // Check if job already exists
          const existing = await prisma.job.findFirst({
            where: {
              title: { contains: job.title, mode: 'insensitive' },
              company: { contains: job.company, mode: 'insensitive' }
            }
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          await upsertNormalizedJob(job);
          totalCreated++;

        } catch (error) {
          errors.push(`Job ${job.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Get updated statistics
    const stats = await getJobStatistics();

    console.log(`✅ Enhanced seeding completed: ${totalCreated} created, ${totalSkipped} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: 'Enhanced job seeding completed successfully',
      results: {
        totalCreated,
        totalSkipped,
        totalErrors: errors.length,
        errors: errors.slice(0, 10) // Only return first 10 errors
      },
      stats,
      config: {
        totalJobs,
        sectors,
        includeRemote,
        includeHybrid,
        includeUrgent,
        includeFeatured
      }
    });

  } catch (error) {
    console.error('❌ Enhanced job seeding failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Enhanced job seeding failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate realistic jobs
 */
function generateRealisticJobs(options: {
  totalJobs: number;
  sectors: string | string[];
  includeRemote: boolean;
  includeHybrid: boolean;
  includeUrgent: boolean;
  includeFeatured: boolean;
}) {
  const jobs: any[] = [];
  const sectors = options.sectors === 'all' ? getAllSectors() : 
                  Array.isArray(options.sectors) ? options.sectors : [options.sectors];

  const jobsPerSector = Math.ceil(options.totalJobs / sectors.length);

  for (const sector of sectors) {
    const sectorJobs = generateJobsForSector(sector, jobsPerSector, options);
    jobs.push(...sectorJobs);
  }

  // Shuffle jobs to mix sectors
  return shuffleArray(jobs).slice(0, options.totalJobs);
}

/**
 * Generate jobs for a specific sector
 */
function generateJobsForSector(sector: string, count: number, options: any) {
  const sectorData = getSectorData(sector);
  const jobs: any[] = [];

  for (let i = 0; i < count; i++) {
    const company = getRandomCompany(sector);
    const jobTemplate = getRandomJobTemplate(sector);
    
    jobs.push({
      source: 'seeded',
      sourceId: `seeded_${sector}_${Date.now()}_${i}`,
      title: generateJobTitle(jobTemplate, i),
      company: company.name,
      location: generateLocation(sector, options),
      country: 'IN',
      description: generateJobDescription(jobTemplate, sector),
      requirements: generateRequirements(jobTemplate, sector),
      apply_url: `/jobs/apply/${Date.now()}_${i}`,
      source_url: null,
      postedAt: generateRandomDate(),
      salary: generateSalary(sector, jobTemplate.experienceLevel),
      salaryMin: generateSalaryMin(sector, jobTemplate.experienceLevel),
      salaryMax: generateSalaryMax(sector, jobTemplate.experienceLevel),
      salaryCurrency: 'INR',
      jobType: jobTemplate.jobType,
      experienceLevel: jobTemplate.experienceLevel,
      skills: jobTemplate.skills,
      isRemote: options.includeRemote && Math.random() < 0.3,
      isHybrid: options.includeHybrid && Math.random() < 0.2,
      isUrgent: options.includeUrgent && Math.random() < 0.1,
      isFeatured: options.includeFeatured && Math.random() < 0.05,
      isActive: true,
      sector: sector,
      raw: {
        seeded: true,
        sector: sector,
        template: jobTemplate.type
      }
    });
  }

  return jobs;
}

/**
 * Get all available sectors
 */
function getAllSectors(): string[] {
  return [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Consulting',
    'Media',
    'Real Estate',
    'Automotive',
    'Energy',
    'Telecommunications',
    'Retail',
    'Hospitality',
    'Transportation'
  ];
}

/**
 * Get sector-specific data
 */
function getSectorData(sector: string) {
  const sectorData: Record<string, any> = {
    Technology: {
      companies: ['TechCorp', 'InnovateLab', 'CodeCraft', 'DataFlow', 'CloudTech'],
      locations: ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai'],
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker']
    },
    Finance: {
      companies: ['FinTech Pro', 'BankTech', 'InvestCorp', 'MoneyFlow', 'CapitalOne'],
      locations: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
      skills: ['Financial Analysis', 'Risk Management', 'SQL', 'Excel', 'Python', 'Tableau']
    },
    Healthcare: {
      companies: ['HealthTech', 'MedCare', 'BioTech', 'CarePlus', 'Wellness Corp'],
      locations: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad'],
      skills: ['Medical Knowledge', 'Data Analysis', 'Research', 'Communication', 'Problem Solving']
    }
  };

  return sectorData[sector] || sectorData.Technology;
}

/**
 * Generate job templates for sector
 */
function getRandomJobTemplate(sector: string) {
  const templates: Record<string, any[]> = {
    Technology: [
      { type: 'developer', experienceLevel: 'mid', jobType: 'full-time', skills: ['JavaScript', 'React', 'Node.js'] },
      { type: 'senior-developer', experienceLevel: 'senior', jobType: 'full-time', skills: ['Python', 'AWS', 'Docker'] },
      { type: 'data-scientist', experienceLevel: 'mid', jobType: 'full-time', skills: ['Python', 'Machine Learning', 'SQL'] },
      { type: 'devops', experienceLevel: 'mid', jobType: 'full-time', skills: ['AWS', 'Docker', 'Kubernetes'] },
      { type: 'ui-ux', experienceLevel: 'mid', jobType: 'full-time', skills: ['Figma', 'Adobe XD', 'User Research'] }
    ],
    Finance: [
      { type: 'analyst', experienceLevel: 'junior', jobType: 'full-time', skills: ['Financial Analysis', 'Excel', 'SQL'] },
      { type: 'manager', experienceLevel: 'senior', jobType: 'full-time', skills: ['Leadership', 'Risk Management', 'Strategy'] },
      { type: 'advisor', experienceLevel: 'mid', jobType: 'full-time', skills: ['Client Relations', 'Investment', 'Communication'] }
    ],
    Healthcare: [
      { type: 'nurse', experienceLevel: 'mid', jobType: 'full-time', skills: ['Patient Care', 'Medical Knowledge', 'Communication'] },
      { type: 'doctor', experienceLevel: 'senior', jobType: 'full-time', skills: ['Medical Diagnosis', 'Treatment', 'Leadership'] },
      { type: 'researcher', experienceLevel: 'mid', jobType: 'full-time', skills: ['Research', 'Data Analysis', 'Statistics'] }
    ]
  };

  const sectorTemplates = templates[sector] || templates.Technology;
  return sectorTemplates[Math.floor(Math.random() * sectorTemplates.length)];
}

/**
 * Generate random company
 */
function getRandomCompany(sector: string) {
  const sectorData = getSectorData(sector);
  const name = sectorData.companies[Math.floor(Math.random() * sectorData.companies.length)];
  return { name };
}

/**
 * Generate job title
 */
function generateJobTitle(template: any, index: number): string {
  const prefixes = ['Senior', 'Lead', 'Principal', 'Staff', 'Associate'];
  const suffixes = ['Engineer', 'Developer', 'Analyst', 'Manager', 'Specialist', 'Consultant'];
  
  if (Math.random() < 0.3) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }
  
  return `${template.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${index + 1})`;
}

/**
 * Generate location
 */
function generateLocation(sector: string, options: any): string {
  const sectorData = getSectorData(sector);
  const locations = sectorData.locations;
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  // Add remote/hybrid indicators
  if (options.includeRemote && Math.random() < 0.3) {
    return `${location} (Remote)`;
  }
  if (options.includeHybrid && Math.random() < 0.2) {
    return `${location} (Hybrid)`;
  }
  
  return location;
}

/**
 * Generate job description
 */
function generateJobDescription(template: any, sector: string): string {
  const descriptions = [
    `We are looking for a talented ${template.type.replace('-', ' ')} to join our ${sector.toLowerCase()} team. You will be responsible for developing innovative solutions and contributing to our growing company.`,
    `Join our dynamic ${sector.toLowerCase()} team as a ${template.type.replace('-', ' ')}. This role offers excellent growth opportunities and the chance to work with cutting-edge technology.`,
    `We're seeking an experienced ${template.type.replace('-', ' ')} to help drive our ${sector.toLowerCase()} initiatives forward. You'll work in a collaborative environment with talented professionals.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Generate requirements
 */
function generateRequirements(template: any, sector: string): string {
  const baseRequirements = [
    `Bachelor's degree in relevant field`,
    `2-5 years of experience in ${sector.toLowerCase()}`,
    `Strong problem-solving skills`,
    `Excellent communication skills`,
    `Ability to work in a team environment`
  ];
  
  const skillRequirements = template.skills.map((skill: string) => `Experience with ${skill}`);
  
  return [...baseRequirements, ...skillRequirements].slice(0, 5).join('\n');
}

/**
 * Generate random date within last 30 days
 */
function generateRandomDate(): string {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime).toISOString();
}

/**
 * Generate salary
 */
function generateSalary(sector: string, experienceLevel: string): string {
  const min = generateSalaryMin(sector, experienceLevel);
  const max = generateSalaryMax(sector, experienceLevel);
  return `₹${min.toLocaleString()}-${max.toLocaleString()}`;
}

/**
 * Generate minimum salary
 */
function generateSalaryMin(sector: string, experienceLevel: string): number {
  const baseSalaries: Record<string, Record<string, number>> = {
    Technology: { junior: 300000, mid: 600000, senior: 1200000 },
    Finance: { junior: 400000, mid: 800000, senior: 1500000 },
    Healthcare: { junior: 250000, mid: 500000, senior: 1000000 }
  };
  
  const baseSalary = baseSalaries[sector]?.[experienceLevel] || baseSalaries.Technology[experienceLevel];
  return Math.floor(baseSalary * (0.8 + Math.random() * 0.4)); // ±20% variation
}

/**
 * Generate maximum salary
 */
function generateSalaryMax(sector: string, experienceLevel: string): number {
  const min = generateSalaryMin(sector, experienceLevel);
  return Math.floor(min * (1.2 + Math.random() * 0.3)); // 20-50% higher than min
}

/**
 * Get job statistics
 */
async function getJobStatistics() {
  const totalJobs = await prisma.job.count();
  const jobsBySector = await prisma.job.groupBy({
    by: ['sector'],
    _count: { id: true }
  });
  const jobsBySource = await prisma.job.groupBy({
    by: ['source'],
    _count: { id: true }
  });

  return {
    totalJobs,
    jobsBySector,
    jobsBySource,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
