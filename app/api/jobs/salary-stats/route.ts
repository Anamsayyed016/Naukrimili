import { NextRequest, NextResponse } from 'next/server';
import { getAdzunaService } from '../../../../lib/adzuna-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const what = searchParams.get('what') || '';
    const where = searchParams.get('where') || '';
    const category = searchParams.get('category');
    const company = searchParams.get('company');

    const adzunaService = getAdzunaService();
    
    const result = await adzunaService.getSalaryHistogram({
      what,
      where,
      category: category || undefined,
      company: company || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching salary statistics:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching salary statistics.' },
      { status: 500 }
    );
  }
}
