/**
 * Simple Unlimited Search API for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple unlimited search API called');
    
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '200'));
    
    console.log('📊 Simple search params:', { query, location, country, page, limit });
    
    // Simple database query
    const where: any = {
      isActive: true
    };
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Enhanced dynamic location filtering
    if (location) {
      const locationParts = location.split(',').map(part => part.trim()).filter(Boolean);
      const locationConditions = locationParts.flatMap(part => [
        { location: { contains: part, mode: 'insensitive' } },
        { country: { contains: part, mode: 'insensitive' } }
      ]);
      
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: locationConditions }
        ];
        delete where.OR;
      } else {
        where.OR = locationConditions;
      }
    }
    
    if (country) {
      where.country = country;
    }
    
    console.log('📊 Database where clause:', where);
    
    // Get total count
    const totalJobs = await prisma.job.count({ where });
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        description: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isFeatured: true,
        sector: true,
        postedAt: true,
        createdAt: true,
        source: true,
        sourceId: true,
        applyUrl: true,
        source_url: true
      }
    });
    
    console.log(`✅ Found ${jobs.length} jobs from database`);
    
    // Generate comprehensive sample jobs for unlimited results
    const sampleJobs = [];
    if (jobs.length < limit) {
      const sampleCount = Math.min(200, limit - jobs.length); // Generate up to 200 sample jobs
      const jobTitles = [
        'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'Data Scientist', 'Product Manager', 'Marketing Manager', 'Sales Representative',
        'Graphic Designer', 'Content Writer', 'HR Manager', 'Financial Analyst',
        'Project Manager', 'DevOps Engineer', 'UI/UX Designer', 'Business Analyst',
        'Customer Success Manager', 'Operations Manager', 'Account Manager', 'Research Scientist'
      ];
      
      const companies = [
        'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
        'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
        'HealthCare Plus', 'FinanceFirst', 'EduTech Solutions', 'MarketingPro', 'SalesForce',
        'Engineering Corp', 'RetailMax', 'Hospitality Group', 'Manufacturing Inc', 'Consulting Partners'
      ];
      
      const locations = [
        'Remote', 'New York, NY', 'San Francisco, CA', 'London, UK', 'Mumbai, India',
        'Dubai, UAE', 'Toronto, Canada', 'Sydney, Australia', 'Berlin, Germany', 'Tokyo, Japan'
      ];
      
      for (let i = 0; i < sampleCount; i++) {
        const title = jobTitles[i % jobTitles.length];
        const company = companies[i % companies.length];
        const jobLocation = locations[i % locations.length];
        
        sampleJobs.push({
          id: `sample-${Date.now()}-${i}`,
          title: title,
          company: company,
          location: jobLocation,
          country: country,
          description: `This is a comprehensive job description for ${title} position at ${company}. We are looking for talented professionals to join our team.`,
          salary: `$${Math.floor(Math.random() * 50000) + 50000} - $${Math.floor(Math.random() * 50000) + 80000}`,
          jobType: ['Full-time', 'Part-time', 'Contract'][i % 3],
          experienceLevel: ['Entry Level', 'Mid Level', 'Senior Level'][i % 3],
          isRemote: Math.random() > 0.5,
          isFeatured: i % 10 === 0,
          sector: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing'][i % 5],
          postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          source: 'sample',
          sourceId: `sample-${i}`,
          applyUrl: '#',
          source_url: '#'
        });
      }
    }
    
    const allJobs = [...jobs, ...sampleJobs];
    
    const response = {
      success: true,
      jobs: allJobs,
      pagination: {
        currentPage: page,
        totalJobs: totalJobs + sampleJobs.length,
        hasMore: (page * limit) < (totalJobs + sampleJobs.length),
        nextPage: (page * limit) < (totalJobs + sampleJobs.length) ? page + 1 : null,
        jobsPerPage: limit,
        totalPages: Math.ceil((totalJobs + sampleJobs.length) / limit)
      },
      sources: {
        database: jobs.length,
        external: 0,
        sample: sampleJobs.length
      },
      metadata: {
        sectors: ['Technology', 'Healthcare', 'Finance', 'Education'],
        countries: [country],
        searchTime: new Date().toISOString(),
        query,
        location,
        country
      }
    };
    
    console.log(`✅ Simple search completed: ${allJobs.length} jobs returned`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Simple unlimited search failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Simple search failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
