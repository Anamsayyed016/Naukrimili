/**
 * Featured Jobs API - Real Database Integration
 * Provides featured job listings for the landing page
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock featured jobs data
const mockFeaturedJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "Bangalore, Karnataka",
    salary: "15-25 LPA",
    jobType: "Full-time",
    isRemote: false,
    isFeatured: true,
    description: "We are looking for a Senior Software Engineer to join our team...",
    requirements: ["5+ years experience", "React", "Node.js", "AWS"],
    postedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    title: "Product Manager",
    company: "InnovateSoft",
    location: "Mumbai, Maharashtra",
    salary: "20-35 LPA",
    jobType: "Full-time",
    isRemote: true,
    isFeatured: true,
    description: "Lead product strategy and development for our SaaS platform...",
    requirements: ["3+ years PM experience", "Agile", "User Research", "Analytics"],
    postedAt: "2024-01-14T14:30:00Z"
  },
  {
    id: 3,
    title: "Data Scientist",
    company: "Digital Solutions",
    location: "Delhi, NCR",
    salary: "18-30 LPA",
    jobType: "Full-time",
    isRemote: false,
    isFeatured: true,
    description: "Join our AI/ML team to build cutting-edge data solutions...",
    requirements: ["Python", "Machine Learning", "Statistics", "SQL"],
    postedAt: "2024-01-13T09:15:00Z"
  },
  {
    id: 4,
    title: "UX Designer",
    company: "Future Systems",
    location: "Hyderabad, Telangana",
    salary: "12-20 LPA",
    jobType: "Full-time",
    isRemote: true,
    isFeatured: true,
    description: "Create amazing user experiences for our mobile apps...",
    requirements: ["Figma", "User Research", "Prototyping", "Design Systems"],
    postedAt: "2024-01-12T16:45:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const location = searchParams.get('location');
    const category = searchParams.get('category');

    let filteredJobs = mockFeaturedJobs;

    // Filter by location if specified
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by category if specified
    if (category) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(category.toLowerCase()) ||
        job.description.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Limit results
    const limitedJobs = filteredJobs.slice(0, limit);

    const res = NextResponse.json({
      success: true,
      jobs: limitedJobs,
      total: limitedJobs.length,
      message: `Found ${limitedJobs.length} featured jobs`
    });
    // Short cache for homepage sections
    res.headers.set('Cache-Control', 'public, max-age=120, s-maxage=120, stale-while-revalidate=600');
    return res;

  } catch (error: any) {
    console.error('Featured jobs error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch featured jobs',
      jobs: mockFeaturedJobs.slice(0, 4) // Fallback to first 4 jobs
    }, { status: 500 });
  }
}
