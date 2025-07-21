import { NextRequest, NextResponse } from 'next/server';
import { getAdzunaService } from '../../../../lib/adzuna-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const what = searchParams.get('what') || '';
    const where = searchParams.get('where') || '';
    const distance = searchParams.get('distance');
    const salary_min = searchParams.get('salary_min');
    const salary_max = searchParams.get('salary_max');
    const results_per_page = searchParams.get('results_per_page') || '10';
    const page = searchParams.get('page') || '1';
    const sort_by = searchParams.get('sort_by') || 'relevance';
    const full_time = searchParams.get('full_time');
    const part_time = searchParams.get('part_time');
    const contract = searchParams.get('contract');
    const category = searchParams.get('category');

    const adzunaService = getAdzunaService();
    
    const result = await adzunaService.searchJobs({
      what,
      where,
      distance: distance ? Number(distance) : undefined,
      salary_min: salary_min ? Number(salary_min) : undefined,
      salary_max: salary_max ? Number(salary_max) : undefined,
      results_per_page: Number(results_per_page),
      page: Number(page),
      sort_by: sort_by as 'relevance' | 'date' | 'salary',
      full_time: full_time ? Number(full_time) as 0 | 1 : undefined,
      part_time: part_time ? Number(part_time) as 0 | 1 : undefined,
      contract: contract ? Number(contract) as 0 | 1 : undefined,
      category: category || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching jobs.' },
      { status: 500 }
    );
  }
}
