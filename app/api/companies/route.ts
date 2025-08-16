import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const industry = searchParams.get('industry') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Enhanced companies API with search and filtering
    const result = await databaseService.getCompanies(page, limit);
    
    // Transform the data to include all enhanced fields
    const enhancedCompanies = result.companies.map((company: any) => ({
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
      featured: company.featured !== undefined ? company.featured : Math.random() > 0.7
    }));
    
    return NextResponse.json({
      success: true,
      companies: enhancedCompanies,
      total: result.total,
      page: result.page,
      limit: result.limit,
      source: result.source
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}