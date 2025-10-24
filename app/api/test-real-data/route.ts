/**
 * Quick Fix - Simple Working Jobs API for Testing
 * This uses the same Prisma approach as the working seed script
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const jobs = [
      { id: '1', title: 'Senior Software Engineer', company: 'TechCorp', location: 'Bangalore', country: 'IN', salary: '15-25 LPA', job_type: 'full-time', remote: true, featured: true, posted_at: new Date().toISOString() },
      { id: '2', title: 'Product Manager', company: 'InnovateSoft', location: 'Mumbai', country: 'IN', salary: '20-35 LPA', job_type: 'full-time', remote: false, featured: true, posted_at: new Date().toISOString() },
      { id: '3', title: 'Data Scientist', company: 'Digital Solutions', location: 'Delhi', country: 'IN', salary: '18-30 LPA', job_type: 'full-time', remote: false, featured: false, posted_at: new Date().toISOString() },
    ];

    return NextResponse.json({
      success: true,
      message: 'Mock real-data test successful',
      jobs,
      total_jobs: jobs.length,
      database_status: 'MOCKED',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed', message: error.message }, { status: 500 });
  }
}
