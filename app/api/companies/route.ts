import { NextRequest, NextResponse } from 'next/server';

// Mock companies data
const mockCompanies = [
  { id: 1, name: 'TechCorp', location: 'Bangalore', industry: 'Technology' },
  { id: 2, name: 'InnovateSoft', location: 'Mumbai', industry: 'Software' },
  { id: 3, name: 'Digital Solutions', location: 'Delhi', industry: 'IT Services' },
  { id: 4, name: 'Future Systems', location: 'Hyderabad', industry: 'Technology' },
];

export async function GET(request: NextRequest) {
  try {
    // This is a mock implementation and will always return the full list
    return NextResponse.json({
      success: true,
      companies: mockCompanies,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
    }, { status: 500 });
  }
}