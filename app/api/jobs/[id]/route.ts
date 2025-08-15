/**
 * Enhanced Job Details API - Mock Data for Build
 * GET /api/jobs/[id] - Get specific job with enhanced features
 * 
 * This file uses the standard Next.js 15+ API route pattern
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock job data for build compatibility
const mockJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Tech Corp",
    companyLogo: "/logos/techcorp.png",
    location: "Mumbai, India",
    country: "India",
    description: "We are looking for a Senior Software Engineer to join our team...",
    applyUrl: "/jobs/1/apply",
    postedAt: "2024-01-15",
    salary: "15-25 LPA",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Senior",
    skills: ["React", "Node.js", "TypeScript"],
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: true,
    sector: "Technology",
    views: 150,
    applications: 25,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    creator: {
      id: 1,
      name: "HR Manager",
      company: "Tech Corp"
    }
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Find job in mock data
    const job = mockJobs.find(j => j.id === id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
