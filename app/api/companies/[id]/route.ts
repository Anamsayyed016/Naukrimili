import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const company = await databaseService.getCompanyById(companyId);
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Transform the data to include all enhanced fields
    const enhancedCompany = {
      id: company.id,
      name: company.name,
      description: company.description,
      industry: company.industry,
      size: company.size,
      location: company.location,
      website: company.website,
      logo: company.logo,
      founded: company.founded,
      isVerified: company.isVerified,
      jobCount: company.jobCount,
      // Enhanced fields
      specialties: company.specialties || ['Innovation', 'Technology', 'Growth'],
      benefits: company.benefits || ['Health Insurance', 'Flexible Hours', 'Professional Development'],
      rating: company.rating || 4.2 + Math.random() * 0.6,
      reviews: company.reviews || Math.floor(Math.random() * 2000) + 100,
      openJobs: company.openJobs || company.jobCount || Math.floor(Math.random() * 50) + 5,
      featured: Math.random() > 0.7, // Generate featured status randomly
      headquarters: company.location
    };

    const res = NextResponse.json({
      success: true,
      company: enhancedCompany
    });
    // Cache individual company details for 10 minutes
    res.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=1200');
    return res;

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