import { NextRequest, NextResponse } from 'next/server';

// Mock jobs data
const mockJobs = [
  { id: 1, title: 'Software Engineer', company: 'TechCorp', location: 'Bangalore' },
  { id: 2, title: 'Product Manager', company: 'InnovateSoft', location: 'Mumbai' },
  { id: 3, title: 'Data Scientist', company: 'Digital Solutions', location: 'Delhi' },
  { id: 4, title: 'UX Designer', company: 'Future Systems', location: 'Hyderabad' },
];

export async function GET(request: NextRequest) {
  try {
    // This is a mock implementation and will always return the full list
    return NextResponse.json({
      success: true,
      jobs: mockJobs,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
    }, { status: 500 });
  }
}
