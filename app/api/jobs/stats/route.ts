/**
 * Enhanced Job Statistics API - Real Database Integration
 * GET /api/jobs/stats - Get comprehensive job market statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobService } from '@/lib/enhanced-job-service';
import { databaseService } from '@/lib/database-service';
import { z } from 'zod';

// Statistics query schema
const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  location: z.string().optional(),
  sector: z.string().optional(),
  company: z.string().optional(),
  job_type: z.string().optional(),
  experience_level: z.string().optional(),
  include_trends: z.string().optional().transform(val => val === 'true'),
  include_salary: z.string().optional().transform(val => val === 'true'),
  include_skills: z.string().optional().transform(val => val === 'true'),
});

// GET /api/jobs/stats - Get comprehensive job market statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and parse query parameters
    const validatedParams = statsQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (validatedParams.period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }

    // Build filters for statistics
    const filters = {
      location: validatedParams.location,
      sector: validatedParams.sector,
      company: validatedParams.company,
      jobType: validatedParams.job_type,
      experienceLevel: validatedParams.experience_level,
    };

    // Get basic job statistics
    const basicStats = await enhancedJobService.getJobStats(filters);

    // Prepare response data
    const responseData: any = {
      period: validatedParams.period,
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      filters: filters,
      overview: {
        total_jobs: basicStats.total,
        active_jobs: basicStats.total, // assume filtered to active
        company_jobs: 0,
        location_jobs: 0,
        sector_jobs: 0,
        remote_jobs: 0,
        hybrid_jobs: 0,
        featured_jobs: 0,
        urgent_jobs: 0,
      },
    };

    // Add salary statistics if requested
    if (validatedParams.include_salary) {
      const avgAcrossRanges = basicStats.salaryRanges.length
        ? Math.round(
            basicStats.salaryRanges.reduce((sum, r) => sum + (r.avgSalary || 0), 0) /
              basicStats.salaryRanges.length
          )
        : 0;
      responseData.salary_stats = {
        average_salary: avgAcrossRanges,
        median_salary: null,
        salary_range: null,
        salary_distribution: basicStats.salaryRanges,
      };
    }

    // Add trending data if requested
    if (validatedParams.include_trends) {
      const trendingData = await getTrendingData(startDate, now, filters);
      responseData.trends = trendingData;
    }

    // Add top skills if requested
    if (validatedParams.include_skills) {
      const skillsData = await getTopSkillsData(filters);
      responseData.top_skills = skillsData;
    }

    // Add additional analytics
    responseData.analytics = {
      job_types: await getJobTypeDistribution(filters),
      experience_levels: await getExperienceLevelDistribution(filters),
      top_companies: await getTopCompanies(filters, 10),
      top_locations: await getTopLocations(filters, 10),
      top_sectors: await getTopSectors(filters, 10),
    };

    return NextResponse.json({
      success: true,
      message: 'Job statistics retrieved successfully',
      stats: responseData,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Job stats error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle database errors
    if (error.name === 'DatabaseError') {
      return NextResponse.json({
        success: false,
        error: 'Database error occurred',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job statistics',
      message: error.message,
    }, { status: 500 });
  }
}

// Helper function to get trending data
async function getTrendingData(startDate: Date, endDate: Date, filters: any) {
  try {
    const db = databaseService.getClient();
    
    // Build where clause for filters
    const whereConditions = ['isActive = true'];
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;

    if (filters.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }
    
    if (filters.sector) {
      whereConditions.push(`sector = $${paramIndex}`);
      params.push(filters.sector);
      paramIndex++;
    }
    
    if (filters.company) {
      whereConditions.push(`company ILIKE $${paramIndex}`);
      params.push(`%${filters.company}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as jobs_posted,
        COUNT(CASE WHEN "isRemote" = true THEN 1 END) as remote_jobs,
        COUNT(CASE WHEN "isUrgent" = true THEN 1 END) as urgent_jobs,
        COUNT(CASE WHEN "isFeatured" = true THEN 1 END) as featured_jobs
      FROM "Job" 
      WHERE ${whereClause} 
        AND "createdAt" >= $1 
        AND "createdAt" <= $2
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
      LIMIT 30
    `, params);

    return result.rows.map(row => ({
      date: row.date,
      jobs_posted: parseInt(row.jobs_posted),
      remote_jobs: parseInt(row.remote_jobs),
      urgent_jobs: parseInt(row.urgent_jobs),
      featured_jobs: parseInt(row.featured_jobs),
    }));
  } catch (error) {
    console.error('Error fetching trending data:', error);
    return [];
  }
}

// Helper function to get top skills data
async function getTopSkillsData(filters: any) {
  try {
    const db = databaseService.getClient();
    
    // Build where clause for filters
    const whereConditions = ['isActive = true', 'array_length(skills, 1) > 0'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }
    
    if (filters.sector) {
      whereConditions.push(`sector = $${paramIndex}`);
      params.push(filters.sector);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        skill,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM (
        SELECT unnest(skills) as skill
        FROM "Job"
        WHERE ${whereClause}
      ) skills_expanded
      GROUP BY skill
      ORDER BY count DESC
      LIMIT 20
    `, params);

    return result.rows.map(row => ({
      skill: row.skill,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage),
    }));
  } catch (error) {
    console.error('Error fetching skills data:', error);
    return [];
  }
}

// Helper function to get job type distribution
async function getJobTypeDistribution(filters: any) {
  try {
    const db = databaseService.getClient();
    
    const whereConditions = ['isActive = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        "jobType",
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM "Job"
      WHERE ${whereClause}
      GROUP BY "jobType"
      ORDER BY count DESC
    `, params);

    return result.rows.map(row => ({
      job_type: row.jobType,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage),
    }));
  } catch (error) {
    console.error('Error fetching job type distribution:', error);
    return [];
  }
}

// Helper function to get experience level distribution
async function getExperienceLevelDistribution(filters: any) {
  try {
    const db = databaseService.getClient();
    
    const whereConditions = ['isActive = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.sector) {
      whereConditions.push(`sector = $${paramIndex}`);
      params.push(filters.sector);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        "experienceLevel",
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM "Job"
      WHERE ${whereClause}
      GROUP BY "experienceLevel"
      ORDER BY count DESC
    `, params);

    return result.rows.map(row => ({
      experience_level: row.experienceLevel,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage),
    }));
  } catch (error) {
    console.error('Error fetching experience level distribution:', error);
    return [];
  }
}

// Helper function to get top companies
async function getTopCompanies(filters: any, limit: number = 10) {
  try {
    const db = databaseService.getClient();
    
    const whereConditions = ['isActive = true'];
    const params: any[] = [limit];
    let paramIndex = 2;

    if (filters.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        company,
        COUNT(*) as job_count,
        COUNT(CASE WHEN "isRemote" = true THEN 1 END) as remote_jobs,
        AVG("salaryMin") as avg_salary_min,
        AVG("salaryMax") as avg_salary_max
      FROM "Job"
      WHERE ${whereClause} AND company IS NOT NULL
      GROUP BY company
      ORDER BY job_count DESC
      LIMIT $1
    `, params);

    return result.rows.map(row => ({
      company: row.company,
      job_count: parseInt(row.job_count),
      remote_jobs: parseInt(row.remote_jobs),
      avg_salary_min: row.avg_salary_min ? Math.round(parseFloat(row.avg_salary_min)) : null,
      avg_salary_max: row.avg_salary_max ? Math.round(parseFloat(row.avg_salary_max)) : null,
    }));
  } catch (error) {
    console.error('Error fetching top companies:', error);
    return [];
  }
}

// Helper function to get top locations
async function getTopLocations(filters: any, limit: number = 10) {
  try {
    const db = databaseService.getClient();
    
    const whereConditions = ['isActive = true'];
    const params: any[] = [limit];
    let paramIndex = 2;

    if (filters.sector) {
      whereConditions.push(`sector = $${paramIndex}`);
      params.push(filters.sector);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        location,
        COUNT(*) as job_count,
        COUNT(CASE WHEN "isRemote" = true THEN 1 END) as remote_jobs,
        AVG("salaryMin") as avg_salary_min
      FROM "Job"
      WHERE ${whereClause} AND location IS NOT NULL
      GROUP BY location
      ORDER BY job_count DESC
      LIMIT $1
    `, params);

    return result.rows.map(row => ({
      location: row.location,
      job_count: parseInt(row.job_count),
      remote_jobs: parseInt(row.remote_jobs),
      avg_salary_min: row.avg_salary_min ? Math.round(parseFloat(row.avg_salary_min)) : null,
    }));
  } catch (error) {
    console.error('Error fetching top locations:', error);
    return [];
  }
}

// Helper function to get top sectors
async function getTopSectors(filters: any, limit: number = 10) {
  try {
    const db = databaseService.getClient();
    
    const whereConditions = ['isActive = true'];
    const params: any[] = [limit];
    let paramIndex = 2;

    if (filters.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.query(`
      SELECT 
        sector,
        COUNT(*) as job_count,
        COUNT(CASE WHEN "isRemote" = true THEN 1 END) as remote_jobs,
        AVG("salaryMin") as avg_salary_min
      FROM "Job"
      WHERE ${whereClause} AND sector IS NOT NULL
      GROUP BY sector
      ORDER BY job_count DESC
      LIMIT $1
    `, params);

    return result.rows.map(row => ({
      sector: row.sector,
      job_count: parseInt(row.job_count),
      remote_jobs: parseInt(row.remote_jobs),
      avg_salary_min: row.avg_salary_min ? Math.round(parseFloat(row.avg_salary_min)) : null,
    }));
  } catch (error) {
    console.error('Error fetching top sectors:', error);
    return [];
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
