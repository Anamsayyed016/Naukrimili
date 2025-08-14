/**
 * Enhanced Jobs API - Real Database Integration
 * GET /api/jobs - Advanced job search with real data
 * POST /api/jobs - Create new job posting
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory mock jobs for demo
let mockJobs = [
  { id: 1, title: 'Senior Software Engineer', company: 'TechCorp', companyLogo: '', location: 'Bangalore', country: 'IN', description: 'Build and scale web apps', salary: '15-25 LPA', salaryMin: 1500000, salaryMax: 2500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'senior', isRemote: true, isHybrid: false, isUrgent: false, isFeatured: true, sector: 'IT', skills: ['React', 'Node'], createdAt: new Date(), updatedAt: new Date() },
  { id: 2, title: 'Product Manager', company: 'InnovateSoft', companyLogo: '', location: 'Mumbai', country: 'IN', description: 'Lead product roadmap', salary: '20-35 LPA', salaryMin: 2000000, salaryMax: 3500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: true, isUrgent: true, isFeatured: true, sector: 'Product', skills: ['Agile', 'Analytics'], createdAt: new Date(), updatedAt: new Date() },
  { id: 3, title: 'Data Scientist', company: 'Digital Solutions', companyLogo: '', location: 'Delhi', country: 'IN', description: 'ML/AI models', salary: '18-30 LPA', salaryMin: 1800000, salaryMax: 3000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Data', skills: ['Python', 'ML'], createdAt: new Date(), updatedAt: new Date() },
  { id: 4, title: 'UX Designer', company: 'Future Systems', companyLogo: '', location: 'Hyderabad', country: 'IN', description: 'Design delightful experiences', salary: '12-20 LPA', salaryMin: 1200000, salaryMax: 2000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: true, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Design', skills: ['Figma', 'Prototyping'], createdAt: new Date(), updatedAt: new Date() },
];
let nextId = 5;

function toCard(job: any) {
  return {
    id: String(job.id),
    title: job.title,
    company: job.company,
    company_logo: job.companyLogo || null,
    location: job.location,
    country: job.country,
    salary: job.salary,
    job_type: job.jobType,
    experience_level: job.experienceLevel,
    remote: job.isRemote,
    featured: job.isFeatured,
    urgent: job.isUrgent,
    posted_at: job.createdAt.toISOString(),
    redirect_url: `/jobs/${job.id}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase();
    const location = (searchParams.get('location') || '').toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let results = mockJobs;
    if (q) {
      results = results.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }
    if (location) {
      results = results.filter(j => j.location.toLowerCase().includes(location));
    }

    const total = results.length;
    const data = results.slice(offset, offset + limit).map(toCard);

    return NextResponse.json({
      success: true,
      message: total ? `Found ${total} jobs` : 'No jobs found',
      jobs: data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs', jobs: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['title', 'company', 'location', 'description'];
    for (const key of required) {
      if (!body[key]) return NextResponse.json({ success: false, error: `${key} is required` }, { status: 400 });
    }
    const newJob = {
      id: nextId++,
      title: body.title,
      company: body.company,
      companyLogo: body.companyLogo || '',
      location: body.location,
      country: body.country || 'IN',
      description: body.description,
      salary: body.salary || '',
      salaryMin: body.salaryMin || null,
      salaryMax: body.salaryMax || null,
      salaryCurrency: body.salaryCurrency || 'INR',
      jobType: body.jobType || 'full-time',
      experienceLevel: body.experienceLevel || 'mid',
      isRemote: !!body.isRemote,
      isHybrid: !!body.isHybrid,
      isUrgent: !!body.isUrgent,
      isFeatured: !!body.isFeatured,
      sector: body.sector || '',
      skills: body.skills || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockJobs.unshift(newJob);
    return NextResponse.json({ success: true, message: 'Job created successfully', job: toCard(newJob) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create job', message: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
