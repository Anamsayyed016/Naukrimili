/**
 * Featured Jobs API - Real Database Integration
 * Provides featured job listings for the landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get featured jobs from real database
    const featuredJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        // You can add criteria for featured jobs like:
        // isFeatured: true,
        // OR priority: 'HIGH',
        // OR createdAt within last 7 days
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        jobType: true,
        isRemote: true,
        skills: true,
        createdAt: true,
        description: true
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Format the jobs for the frontend
    const formattedJobs = featuredJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company || 'Company Name',
      location: job.location || 'Location',
      salary: formatSalary(job.salaryMin, job.salaryMax),
      type: job.jobType || 'Full-time',
      isRemote: job.isRemote || false,
      isUrgent: isUrgentJob(job.createdAt),
      posted: getTimeAgo(job.createdAt),
      skills: job.skills || [],
      description: truncateDescription(job.description)
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      total: featuredJobs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Featured jobs API error:', error);
    
    // Return fallback jobs if database fails
    const fallbackJobs = getFallbackJobs(6);
    
    return NextResponse.json({
      success: true,
      jobs: fallbackJobs,
      fallback: true,
      message: 'Using fallback job listings'
    });
  }
}

function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Salary not disclosed';
  
  if (min && max) {
    return `₹${(min / 100000).toFixed(0)}-${(max / 100000).toFixed(0)} LPA`;
  }
  
  if (min) {
    return `₹${(min / 100000).toFixed(0)}+ LPA`;
  }
  
  return `Up to ₹${(max! / 100000).toFixed(0)} LPA`;
}

function isUrgentJob(createdAt: Date): boolean {
  const daysSincePosted = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSincePosted <= 2; // Jobs posted within 2 days are marked urgent
}

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diffInHours = (now - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

function truncateDescription(description?: string | null): string {
  if (!description) return '';
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
}

function getFallbackJobs(count: number) {
  const fallbackJobs = [
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'TechCorp India',
      location: 'Bangalore',
      salary: '₹15-25 LPA',
      type: 'Full-time',
      isRemote: true,
      isUrgent: false,
      posted: '2 days ago'
    },
    {
      id: '2',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'Mumbai',
      salary: '₹20-35 LPA',
      type: 'Full-time',
      isRemote: false,
      isUrgent: true,
      posted: '1 day ago'
    },
    {
      id: '3',
      title: 'UI/UX Designer',
      company: 'Design Studio',
      location: 'Delhi',
      salary: '₹8-15 LPA',
      type: 'Full-time',
      isRemote: true,
      isUrgent: false,
      posted: '3 days ago'
    },
    {
      id: '4',
      title: 'Data Scientist',
      company: 'Analytics Hub',
      location: 'Hyderabad',
      salary: '₹12-22 LPA',
      type: 'Full-time',
      isRemote: true,
      isUrgent: false,
      posted: '1 day ago'
    },
    {
      id: '5',
      title: 'Digital Marketing Manager',
      company: 'MarketPro Solutions',
      location: 'Pune',
      salary: '₹10-18 LPA',
      type: 'Full-time',
      isRemote: false,
      isUrgent: true,
      posted: '2 days ago'
    },
    {
      id: '6',
      title: 'DevOps Engineer',
      company: 'CloudTech',
      location: 'Chennai',
      salary: '₹14-25 LPA',
      type: 'Full-time',
      isRemote: true,
      isUrgent: false,
      posted: '1 day ago'
    }
  ];
  
  return fallbackJobs.slice(0, count);
}
