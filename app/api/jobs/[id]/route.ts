/**
 * Enhanced Job Details API - Real Database Integration
 * GET /api/jobs/[id] - Get specific job with enhanced features
 * PUT /api/jobs/[id] - Update job posting
 * DELETE /api/jobs/[id] - Delete job posting
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory mock jobs for demo
let mockJobs = [
  { id: 1, title: 'Senior Software Engineer', company: 'TechCorp', companyLogo: '', location: 'Bangalore', country: 'IN', description: 'Build and scale web apps', salary: '15-25 LPA', salaryMin: 1500000, salaryMax: 2500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'senior', isRemote: true, isHybrid: false, isUrgent: false, isFeatured: true, sector: 'IT', skills: ['React', 'Node'], createdAt: new Date(), updatedAt: new Date() },
  { id: 2, title: 'Product Manager', company: 'InnovateSoft', companyLogo: '', location: 'Mumbai', country: 'IN', description: 'Lead product roadmap', salary: '20-35 LPA', salaryMin: 2000000, salaryMax: 3500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: true, isUrgent: true, isFeatured: true, sector: 'Product', skills: ['Agile', 'Analytics'], createdAt: new Date(), updatedAt: new Date() },
  { id: 3, title: 'Data Scientist', company: 'Digital Solutions', companyLogo: '', location: 'Delhi', country: 'IN', description: 'ML/AI models', salary: '18-30 LPA', salaryMin: 1800000, salaryMax: 3000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Data', skills: ['Python', 'ML'], createdAt: new Date(), updatedAt: new Date() },
];

function toFrontend(job: any) {
  return {
    id: String(job.id),
    title: job.title,
    company: job.company,
    company_logo: job.companyLogo || null,
    location: job.location,
    country: job.country,
    description: job.description,
    salary: job.salary,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,
    job_type: job.jobType,
    experience_level: job.experienceLevel,
    remote: job.isRemote,
    hybrid: job.isHybrid,
    featured: job.isFeatured,
    urgent: job.isUrgent,
    sector: job.sector,
    skills: job.skills,
    posted_at: job.createdAt.toISOString(),
    apply_url: `/jobs/${job.id}`,
    is_active: true,
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const jobId = Number(id);
    if (!jobId || Number.isNaN(jobId)) {
      return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
    }

    const job = mockJobs.find(j => j.id === jobId);
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    const similar = mockJobs.filter(j => j.id !== jobId).slice(0, 6).map(toFrontend);

    return NextResponse.json({
      success: true,
      job: toFrontend(job),
      similar_jobs: similar,
      statistics: {
        company_jobs: mockJobs.filter(j => j.company === job.company).length,
        location_jobs: mockJobs.filter(j => j.location === job.location).length,
        sector_jobs: mockJobs.filter(j => j.sector === job.sector).length,
        average_salary: Math.round(((job.salaryMin || 0) + (job.salaryMax || 0)) / 2),
        salary_range: job.salary || 'N/A',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch job', message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const jobId = Number(id);
    const body = await request.json();
    const index = mockJobs.findIndex(j => j.id === jobId);
    if (index === -1) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    mockJobs[index] = { ...mockJobs[index], ...body, updatedAt: new Date() };
    return NextResponse.json({ success: true, message: 'Job updated', job: toFrontend(mockJobs[index]) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update job', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const jobId = Number(id);
    const index = mockJobs.findIndex(j => j.id === jobId);
    if (index === -1) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    mockJobs.splice(index, 1);
    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete job', message: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
