import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    
    // Get company details with job count
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Get company's open jobs
    const openJobs = await prisma.job.findMany({
      where: {
        companyId: companyId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        location: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isUrgent: true,
        isFeatured: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Format company data
    const formattedCompany = {
      ...company,
      openJobs: company._count.jobs,
      rating: 4.5, // Default rating
      reviews: Math.floor(Math.random() * 2000) + 100, // Mock reviews for now
      featured: company.isVerified,
      specialties: ['Innovation', 'Technology', 'Growth'], // Default specialties
      benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Learning Budget'], // Default benefits
      headquarters: company.location,
      founded: company.founded?.toString() || 'N/A'
    };
    
    return NextResponse.json({
      success: true,
      company: formattedCompany,
      openJobs: openJobs
    });
    
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      success: true, 
      data: body 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}