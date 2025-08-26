/**
 * Featured Jobs API - Real Database Integration
 * Provides featured job listings for the landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const page = parseInt(searchParams.get('page') || '1');
    const location = searchParams.get('location');
    const category = searchParams.get('category');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = { 
      isActive: true,
      isFeatured: true 
    };

    // Add location filter if specified
    if (location && location.trim().length > 0) {
      where.location = { contains: location.trim(), mode: 'insensitive' };
    }

    // Add category/sector filter if specified
    if (category && category.trim().length > 0) {
      where.sector = { contains: category.trim(), mode: 'insensitive' };
    }

    // Get featured jobs with pagination and related data
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isUrgent: 'desc' },    // Urgent jobs first
          { views: 'desc' },       // Then by popularity
          { createdAt: 'desc' }    // Then by newest
        ],
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true,
              isVerified: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    // Transform jobs to match expected format
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company || job.companyRelation?.name || 'Unknown Company',
      companyLogo: job.companyLogo || job.companyRelation?.logo,
      location: job.location,
      country: job.country,
      description: job.description,
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      skills: job.skills,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      isActive: job.isActive,
      sector: job.sector,
      views: job.views,
      applicationsCount: job.applicationsCount,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      // Company information
      companyInfo: job.companyRelation ? {
        name: job.companyRelation.name,
        logo: job.companyRelation.logo,
        location: job.companyRelation.location,
        industry: job.companyRelation.industry,
        isVerified: job.companyRelation.isVerified
      } : null,
      // Application URLs
      applyUrl: job.applyUrl,
      apply_url: job.apply_url,
      source_url: job.source_url,
      isExternal: job.source !== 'manual'
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          location: location || null,
          category: category || null
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/featured-jobs'
      }
    });

  } catch (error: any) {
    console.error('❌ Featured jobs API error:', error);
    
    // Fallback: Return sample data if database fails
    const fallbackJobs = [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'TechCorp Solutions',
        location: 'Bangalore, Karnataka',
        country: 'IN',
        salary: '25-40 LPA',
        jobType: 'full-time',
        experienceLevel: 'senior',
        isRemote: false,
        isFeatured: true,
        isUrgent: false,
        sector: 'Technology',
        skills: ['React', 'Node.js', 'PostgreSQL'],
        createdAt: new Date(),
        views: 150,
        applicationsCount: 12
      },
      {
        id: 2,
        title: 'Data Scientist',
        company: 'Analytics Pro',
        location: 'Mumbai, Maharashtra', 
        country: 'IN',
        salary: '18-30 LPA',
        jobType: 'full-time',
        experienceLevel: 'mid',
        isRemote: true,
        isFeatured: true,
        isUrgent: true,
        sector: 'Technology',
        skills: ['Python', 'Machine Learning'],
        createdAt: new Date(),
        views: 89,
        applicationsCount: 8
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch featured jobs',
      data: {
        jobs: fallbackJobs,
        pagination: {
          page: 1,
          limit: 8,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      },
      fallback: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
