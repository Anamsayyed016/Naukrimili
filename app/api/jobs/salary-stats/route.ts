import { NextRequest, NextResponse } from 'next/server';
import { getJobStats } from '@/lib/adzuna-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const what = searchParams.get('what')?.trim() || '';
    const where = searchParams.get('where')?.trim() || '';
    const category = searchParams.get('category')?.trim();
    const company = searchParams.get('company')?.trim();

    if (!what && !where && !category && !company) {
      return NextResponse.json({ 
        error: 'At least one search parameter is required' 
      }, { 
        status: 400 
      });
    }

    const query = [what, where, category, company]
      .filter(Boolean)
      .join(' ')
      .trim();
      
    const result = await getJobStats(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching salary statistics:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching salary statistics.' },
      { status: 500 }
    );
  }
}
