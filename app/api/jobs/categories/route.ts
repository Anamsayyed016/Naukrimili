import { NextRequest, NextResponse } from 'next/server';
import { getAdzunaService } from '../../../../lib/adzuna-service';

export async function GET(request: NextRequest) {
  try {
    const adzunaService = getAdzunaService();
    const result = await adzunaService.getCategories();
    
    // Transform the categories into a more usable format
    const categories = Object.entries(result.results).map(([key, value]) => ({
      id: key,
      label: value.label,
      tag: value.tag
    }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching job categories:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching job categories.' },
      { status: 500 }
    );
  }
}
